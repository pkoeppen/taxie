import { DAYS_IN_YEAR, Schedule } from "./constants";
import { BaseTaxCalculatorOptions } from "./types";
import _ from "lodash";

export class BankAccount<Options extends BaseTaxCalculatorOptions> {
  day = 1;
  apy = 0.05;
  schedule = Schedule.Quarterly;
  balance = 0;

  stat = {
    interestYear: 0,
    interestTotal: 0,
    depositsYear: 0,
    depositsTotal: 0,
    withdrawalsYear: 0,
    withdrawalsTotal: 0,
  };

  constructor(options: Options) {
    if (typeof options.apy === "number") {
      this.apy = _.clamp(options.apy, 0, 1);
    }
    if (typeof options.principle === "number") {
      this.balance = options.principle;
    }
    if (options.compoundingSchedule) {
      this.schedule = options.compoundingSchedule;
    }
  }

  tick() {
    if (this.day % Math.floor(DAYS_IN_YEAR / this.schedule) === 0) {
      this.compound();
    }
    this.day++;
  }

  deposit(amount: number) {
    if (amount < 0) {
      throw new Error(`Cannot deposit negative amount`);
    }
    this.balance += amount;
    this.stat.depositsYear += amount;
  }

  withdraw(amount: number) {
    if (amount < 0) {
      throw new Error(`Cannot withdraw negative amount`);
    }
    this.balance -= amount;
    this.stat.withdrawalsYear += amount;
  }

  compound() {
    if (this.balance <= 0) {
      return 0;
    }
    const interest = (this.balance * this.apy) / this.schedule;
    this.balance += interest;
    this.stat.interestYear += interest;
    this.stat.interestTotal += interest;
    return interest;
  }

  recap() {
    const stat = _.clone(this.stat);
    this.stat.interestYear = 0;
    this.stat.depositsYear = 0;
    this.stat.withdrawalsYear = 0;
    return stat;
  }
}
