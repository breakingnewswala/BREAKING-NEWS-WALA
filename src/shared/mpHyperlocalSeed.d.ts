import { ArticleDetail, DistrictItem, DivisionItem, MandiRateItem, ReporterProfile } from '../types';

export declare const MP_DIVISIONS_SEED: DivisionItem[];
export declare const MP_55_DISTRICTS: DistrictItem[];
export declare const MP_SEED_REPORTERS: ReporterProfile[];
export declare const MP_SEED_PENDING_STORIES: ArticleDetail[];
export declare const MP_SEED_MANDI_RATES: MandiRateItem[];
export declare function buildAllDistrictAndCategoryArticles(existingArticles?: ArticleDetail[]): ArticleDetail[];
