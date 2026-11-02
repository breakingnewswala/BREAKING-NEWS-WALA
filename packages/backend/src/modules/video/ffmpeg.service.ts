/**
 * BREAKING NEWS WALA — FFmpeg Service & Safe Subprocess Executor
 * Grounded in docs/11-Architecture.md, docs/16-Storage.md,
 * docs/20-Integrations.md (INT-VID-013, ADR-INT-009), and docs/DECISIONS.md (DEC-015, DEC-020)
 *
 * Security Invariants:
 * 1. NEVER execute unvalidated string shell commands.
 * 2. Arguments are strictly structured string arrays passed to child_process.spawn.
 * 3. Dual-mode executor architecture: RealFfmpegExecutor for production/host and MockFfmpegExecutor for deterministic CI/test environments.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { VideoProjectDocument, VideoResolution } from './types';
import { VIDEO_RESOLUTION_SPECS, VIDEO_ALLOWED_CODECS } from './constants';
import { AppError } from '../../errors/app-error';

export interface FfmpegExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  outputFilePath: string;
  fileSizeBytes: number;
  durationSeconds: number;
}

export interface IFfmpegExecutor {
  isAvailable(): Promise<boolean>;
  getVersion(): Promise<string>;
  execute(
    args: string[],
    outputFilePath: string,
    expectedDurationSec: number,
    onProgress?: (percent: number) => void
  ): Promise<FfmpegExecutionResult>;
}

/**
 * Finds the candidate FFmpeg binary path on the system.
 */
export function resolveFfmpegBinary(): string {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }

  // Windows WinGet default installation location check
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const wingetDefault = path.join(
      process.env.LOCALAPPDATA,
      'Microsoft',
      'WinGet',
      'Packages',
      'Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe',
      'ffmpeg-9.0.1-essentials_build',
      'bin',
      'ffmpeg.exe'
    );
    if (fs.existsSync(wingetDefault)) {
      return wingetDefault;
    }
  }

  return 'ffmpeg';
}

/**
 * Real FFmpeg Subprocess Executor using child_process.spawn with argument arrays.
 */
export class RealFfmpegExecutor implements IFfmpegExecutor {
  private binaryPath: string;

  constructor(binaryPath?: string) {
    this.binaryPath = binaryPath || resolveFfmpegBinary();
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const res = await this.runProcess(['-version'], 3000);
      return res.exitCode === 0 && res.stdout.includes('ffmpeg version');
    } catch {
      return false;
    }
  }

  public async getVersion(): Promise<string> {
    try {
      const res = await this.runProcess(['-version'], 3000);
      const match = res.stdout.match(/ffmpeg version ([^\s]+)/);
      return (match && match[1]) ? match[1] : 'Unknown';
    } catch {
      return 'Unavailable';
    }
  }

  public async execute(
    args: string[],
    outputFilePath: string,
    expectedDurationSec: number,
    onProgress?: (percent: number) => void
  ): Promise<FfmpegExecutionResult> {
    // Validate arguments for security
    this.validateArgs(args);

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const child = spawn(this.binaryPath, args, {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderr += text;

        if (onProgress && expectedDurationSec > 0) {
          // Parse time=HH:MM:SS.ms from ffmpeg progress stderr
          const match = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/);
          if (match) {
            const hours = parseFloat(match[1]);
            const minutes = parseFloat(match[2]);
            const seconds = parseFloat(match[3]);
            const currentTime = hours * 3600 + minutes * 60 + seconds;
            const progress = Math.min(99, Math.round((currentTime / expectedDurationSec) * 100));
            onProgress(progress);
          }
        }
      });

      child.on('error', (err) => {
        reject(AppError.internal(`FFmpeg निष्पादन त्रुटि: ${err.message}`));
      });

      child.on('close', (code) => {
        if (code === 0) {
          if (onProgress) onProgress(100);
          let fileSizeBytes = 0;
          try {
            if (fs.existsSync(outputFilePath)) {
              fileSizeBytes = fs.statSync(outputFilePath).size;
            }
          } catch {
            // non-fatal
          }

          resolve({
            exitCode: 0,
            stdout,
            stderr,
            outputFilePath,
            fileSizeBytes,
            durationSeconds: expectedDurationSec,
          });
        } else {
          reject(
            AppError.internal(
              `FFmpeg रेंडर विफल हुआ (Exit code ${code}): ${stderr.slice(-500) || stdout.slice(-500)}`
            )
          );
        }
      });
    });
  }

  private runProcess(
    args: string[],
    timeoutMs: number
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const child = spawn(this.binaryPath, args, {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const timer = setTimeout(() => {
        child.kill();
        reject(new Error('Process timed out'));
      }, timeoutMs);

      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.stderr.on('data', (d) => (stderr += d.toString()));

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      child.on('close', (exitCode) => {
        clearTimeout(timer);
        resolve({ exitCode: exitCode ?? -1, stdout, stderr });
      });
    });
  }

  private validateArgs(args: string[]): void {
    const dangerousPatterns = [/[;&|`$]/, /\.\.\//];
    for (const arg of args) {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(arg)) {
          throw AppError.badRequest(`अमान्य व असुरक्षित तर्क पहचाना गया: "${arg}"`);
        }
      }
    }
  }
}

/**
 * Mock FFmpeg Executor for deterministic unit tests and offline CI/CD.
 */
export class MockFfmpegExecutor implements IFfmpegExecutor {
  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async getVersion(): Promise<string> {
    return '9.0.1-mock-test';
  }

  public async execute(
    _args: string[],
    outputFilePath: string,
    expectedDurationSec: number,
    onProgress?: (percent: number) => void
  ): Promise<FfmpegExecutionResult> {
    if (onProgress) {
      onProgress(20);
      onProgress(50);
      onProgress(85);
      onProgress(100);
    }

    // Ensure output directory exists and write mock mp4 buffer
    try {
      const dir = path.dirname(outputFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Write mock video header bytes
      const mockBuffer = Buffer.from(
        'BNW-MOCK-MP4-STREAM-1080P-H264-AAC-AUDIO-CANONICAL-TEST-RENDER'
      );
      fs.writeFileSync(outputFilePath, mockBuffer);
    } catch {
      // In-memory or simulated file
    }

    return {
      exitCode: 0,
      stdout: 'Mock FFmpeg rendered successfully',
      stderr: 'frame=900 fps=120 q=-1.0 Lsize=4096kB time=00:00:30.00 bitrate=1118.8kbits/s speed=4.0x',
      outputFilePath,
      fileSizeBytes: 4096 * 1024,
      durationSeconds: expectedDurationSec,
    };
  }
}

/**
 * High-Level FFmpeg Service orchestrating video render plan construction and execution.
 */
export class FfmpegService {
  private executor: IFfmpegExecutor;

  constructor(executor?: IFfmpegExecutor) {
    if (executor) {
      this.executor = executor;
    } else if (process.env.NODE_ENV === 'test') {
      this.executor = new MockFfmpegExecutor();
    } else {
      this.executor = new RealFfmpegExecutor();
    }
  }

  public getExecutor(): IFfmpegExecutor {
    return this.executor;
  }

  /**
   * Builds the sanitized FFmpeg argument list from project document.
   */
  public buildRenderArguments(
    project: VideoProjectDocument,
    outputFilePath: string,
    resolution: VideoResolution = '1080p'
  ): string[] {
    const resSpec = VIDEO_RESOLUTION_SPECS[resolution] || VIDEO_RESOLUTION_SPECS['1080p'];
    const targetWidth = Math.round(project.width * resSpec.widthMultiplier);
    const targetHeight = Math.round(project.height * resSpec.heightMultiplier);
    const fps = project.fps || 30;

    const args: string[] = ['-y']; // Overwrite output file

    // Collect video and image clips
    const videoTracks = project.tracks.filter((t) => t.type === 'video');
    const audioTracks = project.tracks.filter((t) => t.type === 'audio' || t.type === 'voiceover');

    const videoClips = videoTracks.flatMap((t) => t.clips);
    const audioClips = audioTracks.flatMap((t) => t.clips);

    // If no media clips, synthesize color background
    if (videoClips.length === 0) {
      args.push(
        '-f',
        'lavfi',
        '-i',
        `color=c=0x0f172a:s=${targetWidth}x${targetHeight}:d=${project.duration}:r=${fps}`
      );
    } else {
      for (const clip of videoClips) {
        if (clip.mediaUrl && fs.existsSync(clip.mediaUrl)) {
          args.push('-i', clip.mediaUrl);
        } else {
          // Virtual color background for preview clips
          args.push(
            '-f',
            'lavfi',
            '-i',
            `color=c=0x1e293b:s=${targetWidth}x${targetHeight}:d=${clip.timelineDuration || clip.duration || 5}:r=${fps}`
          );
        }
      }
    }

    // Audio inputs
    if (audioClips.length === 0) {
      args.push('-f', 'lavfi', '-i', `anullsrc=r=48000:cl=stereo:d=${project.duration}`);
    } else {
      for (const audio of audioClips) {
        if (audio.mediaUrl && fs.existsSync(audio.mediaUrl)) {
          args.push('-i', audio.mediaUrl);
        } else {
          args.push('-f', 'lavfi', '-i', `anullsrc=r=48000:cl=stereo:d=${audio.timelineDuration || audio.duration || 5}`);
        }
      }
    }

    // Complex filter for scaling, positioning and audio mixing
    const filterParts: string[] = [
      `[0:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:color=black[vbase]`,
    ];

    // Encode options
    args.push('-filter_complex', filterParts.join(';'));
    args.push('-map', '[vbase]');

    // Video codec
    args.push('-c:v', VIDEO_ALLOWED_CODECS.VIDEO[0]);
    args.push('-preset', 'fast');
    args.push('-crf', '23');
    args.push('-pix_fmt', 'yuv420p');
    args.push('-r', String(fps));

    // Audio codec
    args.push('-c:a', VIDEO_ALLOWED_CODECS.AUDIO[0]);
    args.push('-b:a', '192k');
    args.push('-ar', '48000');

    // Duration limit
    args.push('-t', String(project.duration));

    // Faststart for web streaming
    args.push('-movflags', '+faststart');

    // Output destination
    args.push(outputFilePath);

    return args;
  }

  /**
   * Executes a render job with progress reporting.
   */
  public async renderProject(
    project: VideoProjectDocument,
    outputFilePath: string,
    resolution: VideoResolution = '1080p',
    onProgress?: (percent: number) => void
  ): Promise<FfmpegExecutionResult> {
    const args = this.buildRenderArguments(project, outputFilePath, resolution);
    return this.executor.execute(args, outputFilePath, project.duration, onProgress);
  }
}
