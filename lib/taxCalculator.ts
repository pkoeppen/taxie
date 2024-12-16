import { BankAccount } from "./bankAccount";
import {
  CountryCode,
  Currency,
  CurrencySymbol,
  DAYS_IN_YEAR,
  Schedule,
  DE_FederalBrackets,
  DE_FilingStatus,
  US_FederalBrackets,
  US_FilingStatus,
  US_StateBrackets,
  US_States,
  BAS,
  getBasicPay,
  getCategoryByRank,
} from "./constants";
import {
  TaxCalculatorOptions,
  DE_TaxCalculatorOptions,
  US_TaxCalculatorOptions,
  BaseTaxCalculatorOptions,
} from "./types";
import _ from "lodash";

abstract class TaxCalculator<Options extends BaseTaxCalculatorOptions> {
  depositSchedule = Schedule.Biweekly;
  inflationRate = 0.04;
  years = 10;
  currentYear = 0;
  expenses: Options["expenses"] = [];
  account: BankAccount<Options>;

  abstract title: string;
  abstract currency: Currency;

  constructor(options: TaxCalculatorOptions) {
    this.account = new BankAccount(options);

    if (options.depositSchedule) {
      this.depositSchedule = options.depositSchedule;
    }
    if (typeof options.inflationRate === "number") {
      this.inflationRate = options.inflationRate;
    }
    if (typeof options.years === "number") {
      this.years = options.years;
    }
    if (options.expenses) {
      this.expenses = options.expenses;
    }
  }

  abstract getIncome(): {
    incomeTaxable: number;
    incomeExempt: number;
    incomeTotal: number;
  };
  abstract calculateTax(incomeGross: number): number;

  run() {
    const sym = CurrencySymbol[this.currency];

    // logRows([
    //   `Title:             "${this.title}"`,
    //   // `Salary:            ${sym} ${formatNumber(this.salary)}`,
    //   // `Principle:         ${sym} ${formatNumber(this.principle)}`,
    //   // `APY:               ${this.apy * 100} %`,
    //   `Years:             ${this.years}`,
    //   `Deposit %:         ${this.depositPercent * 100} %`,
    //   `Deposit sch.:      ${getKeyByValue(Schedule, this.depositSchedule)}`,
    //   // `Compounding sch.:  ${getKeyByValue(Schedule, this.compoundingSchedule)}`,
    //   //`Filing status:     ${getKeyByValue(FilingStatus, filingStatus)}`,
    //   `Inflation rate:    ${this.inflationRate * 100} %`,
    //   ``,
    // ]);

    // Years are 0-indexed.
    // Days are 1-indexed.

    const log = [];

    while (this.currentYear < this.years) {
      const income = _.mapValues(this.getIncome(), this.applyInflation);
      const { incomeTaxable, incomeExempt, incomeTotal } = income;

      const depositAmount = incomeTotal / this.depositSchedule;
      const expensesMonth = this.applyInflation(this.sumExpenses());
      const expenseAmount =
        expensesMonth / (this.depositSchedule / Schedule.Monthly);

      const expensesYear = expenseAmount * DAYS_IN_YEAR;

      for (let day = 1; day <= DAYS_IN_YEAR; day++) {
        if (day % Math.floor(DAYS_IN_YEAR / this.depositSchedule) === 0) {
          const balanceChange = depositAmount - expenseAmount;
          if (balanceChange >= 0) {
            this.account.deposit(balanceChange);
          } else {
            this.account.withdraw(Math.abs(balanceChange));
          }
        }
        this.account.tick();
      }

      const { interestYear, depositsYear, withdrawalsYear } =
        this.account.recap();

      const incomeGross = incomeTaxable + incomeExempt + interestYear;
      const tax = this.calculateTax(incomeGross);
      const incomeNet = incomeGross - tax - expensesYear;
      const effectiveTaxRate = tax / incomeGross;

      this.account.withdraw(tax); // Everyone's favorite part

      // logRows([
      //   `Year-end ${this.currentYear + 1} ---------------------`,
      //   `  Income taxable:          ${sym} ${formatNumber(incomeTaxable)}`,
      //   `  Income exempt:           ${sym} ${formatNumber(incomeExempt)}`,
      //   `  Interest:                ${sym} ${formatNumber(interestYear)}`,
      //   `  Income gross:            ${sym} ${formatNumber(incomeGross)}`,
      //   `  Income net:              ${sym} ${formatNumber(incomeNet)}`,
      //   `  Expenses:               (${sym} ${formatNumber(expensesYear)})`,
      //   `  Tax:                    (${sym} ${formatNumber(tax)})`,
      //   `  Account:                 ${sym} ${formatNumber(
      //     this.account.balance
      //   )}`,
      //   `  Effective rate:          % ${(effectiveTaxRate * 100).toFixed(1)}`,
      // ]);

      log.push({
        year: this.currentYear + 1,
        incomeTaxable: incomeTaxable,
        incomeExempt: incomeExempt,
        incomeGross: incomeGross,
        incomeNet: incomeNet,
        expensesYear: expensesYear,
        tax: tax,
        depositsYear: depositsYear,
        withdrawalsYear: withdrawalsYear,
      });

      // TODO: handle inflation rate

      this.currentYear++;
    }

    // logRows([
    //   ``,
    //   `------------------------------------`,
    //   `Final account balance: ${sym} ${formatNumber(this.account.balance)}`,
    //   ``,
    // ]);

    return {
      log,
      finalBalance: this.account.balance,
    };
  }

  sumExpenses() {
    if (this.expenses) {
      return this.expenses.reduce((acc, cur) => acc + cur.amount, 0);
    }
    return 0;
  }

  applyInflation = (amount: number) => {
    // Must be arrow function to allow access to child `this`
    return Math.pow(1 + this.inflationRate, this.currentYear) * amount;
  };
}

export class US_TaxCalculator extends TaxCalculator<US_TaxCalculatorOptions> {
  state: US_States;
  currency = Currency.USD;
  filingStatus = US_FilingStatus.Single;
  title = `Option ${CountryCode.US}`;
  salary: US_TaxCalculatorOptions["salary"];
  military: US_TaxCalculatorOptions["military"];

  static FilingStatus = US_FilingStatus;
  static FederalBrackets = US_FederalBrackets;
  static StateBrackets = US_StateBrackets;
  static FICA = 0.0765;

  constructor(options: US_TaxCalculatorOptions) {
    super(options);
    if (options.salary !== undefined) {
      this.salary = options.salary;
    }
    if (options.military !== undefined) {
      this.military = options.military;
    }
    if (typeof options.currency === "number") {
      this.currency = options.currency;
    }
    if (options.filingStatus) {
      this.filingStatus = options.filingStatus;
    }
    if (options.title) {
      this.title = options.title;
    }
    this.state = options.state;
  }

  getIncome() {
    if (this.salary !== undefined) {
      const incomeTaxable = this.salary;
      const incomeExempt = 0;
      const incomeTotal = incomeTaxable + incomeExempt;

      return { incomeTaxable, incomeExempt, incomeTotal };
    } else if (this.military) {
      const { rank, serviceTime, location, dependents } = this.military;

      const mha = this.military.mhaJSON[location];
      const category = getCategoryByRank(rank);
      const basicPay = getBasicPay(rank, serviceTime) * 12;
      const bah = this.military.bahJSON[mha][rank] * 12;
      const bas = BAS[category] * 12;

      const incomeTaxable = basicPay;
      const incomeExempt = bah + bas;
      const incomeTotal = incomeTaxable + incomeExempt;

      return { incomeTaxable, incomeExempt, incomeTotal };
    } else {
      throw new Error(
        `Cannot get income: Missing both 'salary' and 'military' option fields`,
      );
    }
  }

  calculateTax(incomeGross: number) {
    let taxFederal = 0;
    let taxState = 0;
    const taxFICA = incomeGross * US_TaxCalculator.FICA;

    const federal = US_TaxCalculator.FederalBrackets[this.filingStatus];
    const state = (US_TaxCalculator.StateBrackets[this.state] as any)[
      this.filingStatus
    ]; // TODO: add HoH etc state filing status

    const agiFederal = incomeGross - federal.deduction;
    for (const bracket of federal.brackets) {
      const min = this.applyInflation(bracket.min);
      const max = this.applyInflation(bracket.max);
      if (agiFederal > min) {
        const taxableIncome = Math.min(agiFederal, max) - min;
        const tax = taxableIncome * (bracket.rate / 100);
        taxFederal += tax;
      }
    }

    const agiState = incomeGross - state.deduction;
    for (const bracket of state.brackets) {
      const min = this.applyInflation(bracket.min);
      const max = this.applyInflation(bracket.max);
      if (agiState > min) {
        const taxableIncome = Math.min(agiState, max) - min;
        const tax = taxableIncome * (bracket.rate / 100);
        taxState += tax;
      }
    }

    return taxFederal + taxState + taxFICA;
  }
}

export class DE_TaxCalculator extends TaxCalculator<DE_TaxCalculatorOptions> {
  currency = Currency.EUR;
  filingStatus = DE_FilingStatus.SteuerklasseI;
  title = `Option ${CountryCode.DE}`;
  salary: DE_TaxCalculatorOptions["salary"];
  soliThreshold = 18130;
  soliPercent = 0.055;

  static FilingStatus = DE_FilingStatus;
  static FederalBrackets = DE_FederalBrackets;

  constructor(options: DE_TaxCalculatorOptions) {
    super(options);

    this.salary = options.salary;

    if (typeof options.currency === "number") {
      this.currency = options.currency;
    }
    if (options.filingStatus) {
      this.filingStatus = options.filingStatus;
    }
    if (options.title) {
      this.title = options.title;
    }
    if (typeof options.soliThreshold === "number") {
      this.soliThreshold = options.soliThreshold;
    }
    if (typeof options.soliPercent === "number") {
      this.soliPercent = _.clamp(options.soliPercent, 0, 1);
    }
  }

  getIncome() {
    return {
      incomeTaxable: this.salary,
      incomeExempt: 0,
      incomeTotal: this.salary,
    };
  }

  calculateTax(incomeGross: number) {
    let taxFederal = 0;

    const { deduction, brackets } =
      DE_TaxCalculator.FederalBrackets[this.filingStatus];

    const agi = incomeGross - deduction;

    for (const bracket of brackets) {
      const min = this.applyInflation(bracket.min);
      const max = this.applyInflation(bracket.max);

      if (agi > min) {
        const taxableIncome = Math.min(agi, max) - min;
        let rate;

        if (typeof bracket.rate === "object") {
          const rateMax = (bracket.rate as { min: number; max: number }).max;
          const rateMin = (bracket.rate as { min: number; max: number }).min;

          if (agi > max) {
            rate = rateMax;
          } else {
            rate =
              rateMin + (taxableIncome / (max - min)) * (rateMax - rateMin);
          }
        } else if (typeof bracket.rate === "number") {
          rate = bracket.rate;
        } else {
          throw new Error(`Misconfigured tax bracket rate "${bracket.rate}"`);
        }

        taxFederal += taxableIncome * (rate / 100);
      }
    }

    const soliThreshold =
      this.filingStatus === DE_FilingStatus.SteuerklasseI ||
      this.filingStatus === DE_FilingStatus.SteuerklasseII ||
      this.filingStatus === DE_FilingStatus.SteuerklasseVI
        ? this.soliThreshold
        : this.soliThreshold * 2;

    if (taxFederal >= soliThreshold) {
      taxFederal *= 1 + this.soliPercent;
    }

    return taxFederal;
  }
}
