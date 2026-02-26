import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ProductInput {
    id?: bigint;
    purchasePrice: bigint;
    name: string;
    tags: Array<string>;
    description: string;
    specs: string;
    salePrice: bigint;
    images: Array<ExternalBlob>;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ProductContent {
    title: string;
    purchasePrice: bigint;
    tags: Array<string>;
    description: string;
    specs: string;
    salePrice: bigint;
}
export interface HttpResult {
    status: bigint;
    body: string;
    error: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface UITheme {
    accentColor: string;
    darkMode: boolean;
    fontSize: bigint;
}
export interface AppSettings {
    theme: UITheme;
    autoSave: boolean;
    technical: string;
    defaultPlatform: string;
    contentPrefs: ContentPreferences;
}
export interface Affiliate {
    id: bigint;
    link: string;
    commission: bigint;
    notes: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ContentPreferences {
    tone: string;
    language: string;
    style: string;
}
export interface GenerationParams {
    url: string;
    freeText: string;
    audio?: ExternalBlob;
    image?: ExternalBlob;
}
export interface Product {
    id: bigint;
    purchasePrice: bigint;
    name: string;
    tags: Array<string>;
    description: string;
    specs: string;
    salePrice: bigint;
    images: Array<ExternalBlob>;
}
export interface backendInterface {
    addOrUpdateAffiliate(affiliate: Affiliate): Promise<bigint>;
    addOrUpdateProduct(productInput: ProductInput): Promise<bigint>;
    deleteAffiliate(id: bigint): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    fetchUrl(url: string): Promise<HttpResult>;
    generateContent(_params: GenerationParams): Promise<ProductContent>;
    getAffiliate(id: bigint): Promise<Affiliate | null>;
    getAffiliates(): Promise<Array<Affiliate>>;
    getProduct(id: bigint): Promise<Product | null>;
    getProducts(): Promise<Array<Product>>;
    getSettings(): Promise<AppSettings | null>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateSettings(newSettings: AppSettings): Promise<void>;
}
