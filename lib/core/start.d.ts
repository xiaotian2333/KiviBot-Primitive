import type { Config } from 'oicq';
export interface KiviConf {
    account: number;
    login_mode: 'password' | 'qrcode';
    device_mode: 'qrcode' | 'sms';
    password: string;
    admins: number[];
    plugins: string[];
    oicq_config: Config;
}
export declare const start: () => void;
