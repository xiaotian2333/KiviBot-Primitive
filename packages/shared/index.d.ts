/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import type { ImageElem } from 'icqq';
import type { BinaryLike, BinaryToTextEncoding } from 'node:crypto';
export declare function showLogo(): void;
export declare function dirname(meta: ImportMeta | undefined): string;
/**
 * 异步延时函数
 * @param {number} ms 等待毫秒数
 * @return {Promise<void>}
 */
export declare function wait(ms: number): Promise<void>;
/**
 * MD5 加密
 * @param {BinaryLike} text 待 MD5 加密数据，可以是 `string` 字符串
 * @param {BinaryToTextEncoding | undefined} encoding 返回数据编码，不传返回 `Buffer`，可传 `hex` 等返回字符串
 * @return {Buffer | string} MD5 加密后的数据
 */
export declare function md5(text: BinaryLike, encoding?: BinaryToTextEncoding): string | Buffer;
/**
 * JS 对象转换成 `urlencoded` 格式字符串 { name: 'Bob', age: 18 } => name=Bob&age=18
 * @param {Record<number | string, any>} obj JS 对象
 * @return {string} 转换后的字符串
 */
export declare function qs(obj: Record<number | string, any>): string;
/**
 * 生成随机整数
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @return {number} 随机范围内的整数
 */
export declare function randomInt(min: number, max: number): number;
/**
 * 取数组内随机一项
 * @param {Array<T>} array 待操作数组
 * @return {T} 数组内的随机一项
 */
export declare function randomItem<T = any>(array: [T, ...T[]]): T;
/**  版本号比较，前者大时返回  1，后者大返回  -1，相同返回  0 */
export declare function compareVersion(v1: string, v2: string): 1 | 0 | -1;
/**
 * 取格式化时间，默认当前时间，使用 dayjs 的 format 函数封装
 * @param {string | undefined} format 格式化模板，默认'YYYY-MM-DD HH:mm'
 * @param {Date | undefined} date 待格式化的时间，默认当前时间
 * @return {string} 格式化后的时间字符串
 */
export declare function time(format?: string, date?: Date): string;
/** 打乱字符串 */
export declare function shuffleString(str: string): string;
/**
 * 错误信息字符串格式化
 * @param {any} error 待处理错误
 * @return {string} stringify 结果
 */
export declare function stringifyError(error: any): string;
/**
 * 确保目标是数组（非数组套一层变成数组，是数组不做处理）
 * @param {T | T[]} value 确保是数组的值
 * @return {T[]} 数组结果
 */
export declare function ensureArray<T = any>(value: T | T[]): T[];
/**
 * 解析 event.toString() 消息里划分的 qq，支持艾特，可以是 `1141284758` 或者是 `{at:1141284758}` 格式
 *
 * @param {string} qqLikeStr 待解析的字符串
 * @return {number} 解析结果
 */
export declare function parseUin(qqLikeStr: string): number;
/**
 * 判断依赖是否存在
 *
 * @param {string} moduleName 依赖路径
 * @return {boolean} 依赖是否存在
 */
export declare function moduleExists(moduleName: string): boolean;
/** 格式化文件格式大小 */
export declare function formatFileSize(size: number, full?: boolean, hasUnit?: boolean): string;
/**
 * Return a string of time span. (30 days per month and 360 days per year by default)
 *
 * @param {number} milliseconds The date diff milliseconds.
 * @param {boolean} [isZh=true] The time locale. True is means Chinese, while false refers to English.
 * @param full
 * @returns {string} Return the time diff description.
 * @example
 *
 * oim.formatDateDiff(new Date('2020/02/07 02:07') - new Date('2001/04/07 04:07'));
 *    // => '19年1月9天22时'
 *
 * oim.formatDateDiff(new Date('2020/02/07 02:07', false) - new Date('2001/04/07 04:07'));
 *    // => '19y1mo9d22h'
 */
export declare function formatDateDiff(milliseconds: number, isZh?: boolean, full?: boolean): string;
/** 通过 QQ 号获取任意头像链接或头像元素 */
export declare function getQQAvatarLink(qq: number, size: number, element: true): ImageElem;
export declare function getQQAvatarLink(qq: number, size: number, element: false): string;
/** 通过群号获取任意群头像链接或头像元素 */
export declare function getGroupAvatarLink(group: number, size: number, element: true): ImageElem;
export declare function getGroupAvatarLink(group: number, size: number, element: false): string;
