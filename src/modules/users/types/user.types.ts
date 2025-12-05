export interface UserInfo {
    Login: string;
    Group: string;
    CertSerialNumber?: string;
    Rights?: string;
    MQID?: string;
    Registration?: string;
    LastAccess?: string;
    LastPassChange?: string;
    Name: string;
    Company?: string;
    Account?: string;
    Country?: string;
    Language?: string;
    City?: string;
    State?: string;
    ZipCode?: string;
    Address?: string;
    Phone?: string;
    Email: string;
    ID?: string;
    Status?: string;
    Comment?: string;
    Color?: string;
    Password?: string;
    Leverage: number;
    Agent?: string;
    Balance: number;
    Credit: number;
    InterestRate?: number;
    CommissionDaily?: number;
    CommissionMonthly?: number;
    BalancePrevDay?: number;
    BalancePrevMonth?: number;
    EquityPrevDay?: number;
    EquityPrevMonth?: number;
    Margin?: number;
    MarginFree?: number;
    MarginLevel?: number;
    MarginType?: number;
    MarginInitial?: number;
    MarginMaintenance?: number;
    Assets?: number;
    Liabilities?: number;
    DailyCommission?: number;
    DailyAgentCommission?: number;
    MonhtlyCommission?: number;
    MonthlyAgentCommission?: number;
    PrevMonthBalance?: number;
    PrevDayBalance?: number;
    // Add other fields as necessary
}

export interface UserAddParams {
    Login?: string;  // Optional - server auto-assigns if not provided
    PassMain: string;  // Required - master password (use capital P for JSON body)
    PassInvestor: string;  // Required - investor password
    Group: string;  // Required - group name
    Name: string;  // Required - client name
    Leverage?: number;  // Required in practice
    Rights?: string;  // User permissions
    Company?: string;
    Language?: string;
    Country?: string;
    City?: string;
    State?: string;
    ZipCode?: string;
    Address?: string;
    Phone?: string;
    Email?: string;
    ID?: string;  // Identity document number
    Status?: string;
    Comment?: string;
    Color?: string;
    PhonePassword?: string;
    Account?: string;
    Agent?: string;
    MQID?: string;
}

export interface UserUpdateParams {
    Login?: number | string;
    login?: number | string;
    Rights?: string;
    rights?: string;
    Group?: string;
    group?: string;
    Name?: string;
    name?: string;
    Company?: string;
    company?: string;
    Language?: string;
    language?: string;
    Country?: string;
    country?: string;
    City?: string;
    city?: string;
    State?: string;
    state?: string;
    ZipCode?: string;
    zipcode?: string;
    Address?: string;
    address?: string;
    Phone?: string;
    phone?: string;
    Email?: string;
    email?: string;
    ID?: string;
    id?: string;
    Status?: string;
    status?: string;
    Comment?: string;
    comment?: string;
    Color?: string | number;
    color?: string | number;
    PhonePassword?: string;
    pass_phone?: string;
    Leverage?: number | string;
    leverage?: number | string;
    Account?: string;
    account?: string;
    Agent?: string;
    agent?: string;
    MQID?: string;
}

export interface UserChangePasswordParams {
    login: number;
    password: string;
    type: PasswordType;
}

export type PasswordType = 'main' | 'investor' | 'api';

export interface UserBatchParams {
    login?: number[];
    group?: string[];
}

export interface UserAccountInfo {
    Login?: string | number;
    CurrencyDigits?: string | number;
    Balance?: string | number;
    Credit?: string | number;
    Margin?: string | number;
    MarginFree?: string | number;
    MarginLevel?: string | number;
    MarginLeverage?: string | number;
    Profit?: string | number;
    [key: string]: any;
}

export type UserLogins = string[];

export type UserCertificate = string[];

export type UserOtpSecret = string;

export interface UserOtpSecretResponse {
    OTP_SECRET?: string;
}

export interface UserBalanceHistoryItem {
    User?: string | number;
    History?: string | number;
}

export interface UserCheckBalanceResponse {
    Balance?: UserBalanceHistoryItem;
    Credit?: UserBalanceHistoryItem;
}