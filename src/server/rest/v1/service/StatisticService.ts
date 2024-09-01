/* eslint-disable */
import { Action, AuthorizationFilter, Entity } from '../../../../types/Authorization';
import { NextFunction, Request, Response } from 'express';
import StatisticFilter, { ChargingStationStats, StatsDataCategory, StatsDataScope, StatsDataType, StatsGroupBy, UserStats } from '../../../../types/Statistic';
import Tenant, { TenantComponents } from '../../../../types/Tenant';

import AuthorizationService from './AuthorizationService';
import Constants from '../../../../utils/Constants';
import HttpStatisticsGetRequest from '../../../../types/requests/HttpStatisticRequest';
import { ServerAction } from '../../../../types/Server';
import { StatisticDataResult } from '../../../../types/DataResult';
import StatisticsStorage from '../../../../storage/mongodb/StatisticsStorage';
import StatisticsValidatorRest from '../validator/StatisticsValidatorRest';
import UserToken from '../../../../types/UserToken';
import Utils from '../../../../utils/Utils';
import UtilsService from './UtilsService';
import moment from 'moment';

const MODULE_NAME = 'StatisticService';

export default class StatisticService {
  static async handleGetChargingStationConsumptionStatistics(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.STATISTICS,
      Action.READ, Entity.STATISTIC, MODULE_NAME, 'handleGetChargingStationConsumptionStatistics');
    // Filter
    const filteredRequest = StatisticsValidatorRest.getInstance().validateStatisticsGet(req.query);
    // Check auth
    const authorizations = await AuthorizationService.checkAndGetStatisticsAuthorizations(req.tenant, req.user, Action.READ, filteredRequest);
    if (!authorizations.authorized) {
      StatisticService.buildAndReturnEmptyStatisticData(res, filteredRequest, next);
      return;
    }
    // Build filter
    const filter = await StatisticService.buildFilter(filteredRequest, req.tenant, req.user, authorizations);
    // Get Stats
    const transactionStats = await StatisticsStorage.getChargingStationStats(req.tenant, filter, StatsGroupBy.CONSUMPTION);
    // Convert
    const transactions = StatisticService.convertToGraphData(transactionStats, StatsDataCategory.CHARGING_STATION, filter.dataScope);
    // Return data
    await StatisticService.buildAndReturnStatisticData(req, res, transactions, filteredRequest, authorizations, next);
  }

  static async handleGetChargingStationUsageStatistics(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.STATISTICS,
      Action.READ, Entity.STATISTIC, MODULE_NAME, 'handleGetChargingStationUsageStatistics');
    // Filter
    const filteredRequest = StatisticsValidatorRest.getInstance().validateStatisticsGet(req.query);
    // Check auth
    const authorizations = await AuthorizationService.checkAndGetStatisticsAuthorizations(req.tenant, req.user, Action.READ, filteredRequest);
    if (!authorizations.authorized) {
      StatisticService.buildAndReturnEmptyStatisticData(res, filteredRequest, next);
      return;
    }
    // Build filter
    const filter = await StatisticService.buildFilter(filteredRequest, req.tenant, req.user, authorizations);
    // Get Stats
    const transactionStats = await StatisticsStorage.getChargingStationStats(
      req.tenant, filter, StatsGroupBy.USAGE);
    // Convert
    const transactions = StatisticService.convertToGraphData(transactionStats, StatsDataCategory.CHARGING_STATION, filter.dataScope);
    // Return data
    await StatisticService.buildAndReturnStatisticData(req, res, transactions, filteredRequest, authorizations, next);
  }

  static async handleGetChargingStationInactivityStatistics(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.STATISTICS,
      Action.READ, Entity.STATISTIC, MODULE_NAME, 'handleGetChargingStationInactivityStatistics');
    // Filter
    const filteredRequest = StatisticsValidatorRest.getInstance().validateStatisticsGet(req.query);
    // Check auth
    const authorizations = await AuthorizationService.checkAndGetStatisticsAuthorizations(req.tenant, req.user, Action.READ, filteredRequest);
    if (!authorizations.authorized) {
      StatisticService.buildAndReturnEmptyStatisticData(res, filteredRequest, next);
      return;
    }
    // Build filter
    const filter = await StatisticService.buildFilter(filteredRequest, req.tenant, req.user, authorizations);
    // Get Stats
    const transactionStats = await StatisticsStorage.getChargingStationStats(
      req.tenant, filter, StatsGroupBy.INACTIVITY);
    // Convert
    const transactions = StatisticService.convertToGraphData(transactionStats, StatsDataCategory.CHARGING_STATION, filter.dataScope);
    // Return data
    await StatisticService.buildAndReturnStatisticData(req, res, transactions, filteredRequest, authorizations, next);
  }

  static async handleGetChargingStationTransactionsStatistics(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.STATISTICS,
      Action.READ, Entity.STATISTIC, MODULE_NAME, 'handleGetChargingStationTransactionsStatistics');
    // Filter
    const filteredRequest = StatisticsValidatorRest.getInstance().validateStatisticsGet(req.query);
    // Check auth
    const authorizations = await AuthorizationService.checkAndGetStatisticsAuthorizations(req.tenant, req.user, Action.READ, filteredRequest);
    if (!authorizations.authorized) {
      StatisticService.buildAndReturnEmptyStatisticData(res, filteredRequest, next);
      return;
    }
    // Build filter
    const filter = await StatisticService.buildFilter(filteredRequest, req.tenant, req.user, authorizations);
    // Get Stats
    const transactionStats = await StatisticsStorage.getChargingStationStats(
      req.tenant, filter, StatsGroupBy.TRANSACTIONS);
    // Convert
    const transactions = StatisticService.convertToGraphData(
      transactionStats, StatsDataCategory.CHARGING_STATION, filter.dataScope);
    // Return data
    await StatisticService.buildAndReturnStatisticData(req, res, transactions, filteredRequest, authorizations, next);
  }

  static async handleGetChargingStationPricingStatistics(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.STATISTICS,
      Action.READ, Entity.STATISTIC, MODULE_NAME, 'handleGetChargingStationPricingStatistics');
    // Filter
    const filteredRequest = StatisticsValidatorRest.getInstance().validateStatisticsGet(req.query);
    // Check auth
    const authorizations = await AuthorizationService.checkAndGetStatisticsAuthorizations(req.tenant, req.user, Action.READ, filteredRequest);
    if (!authorizations.authorized) {
      StatisticService.buildAndReturnEmptyStatisticData(res, filteredRequest, next);
      return;
    }
    // Build filter
    const filter = await StatisticService.buildFilter(filteredRequest, req.tenant, req.user, authorizations);
    // Get Stats
    const transactionStats = await StatisticsStorage.getChargingStationStats(
      req.tenant, filter, StatsGroupBy.PRICING);
    // Convert
    const transactions = StatisticService.convertToGraphData(
      transactionStats, StatsDataCategory.CHARGING_STATION, filter.dataScope);
    // Return data
    await StatisticService.buildAndReturnStatisticData(req, res, transactions, filteredRequest, authorizations, next);
  }

  static async handleGetUserConsumptionStatistics(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.STATISTICS,
      Action.READ, Entity.STATISTIC, MODULE_NAME, 'handleGetUserConsumptionStatistics');
    // Filter
    const filteredRequest = StatisticsValidatorRest.getInstance().validateStatisticsGet(req.query);
    // Check auth
    const authorizations = await AuthorizationService.checkAndGetStatisticsAuthorizations(req.tenant, req.user, Action.READ, filteredRequest);
    if (!authorizations.authorized) {
      StatisticService.buildAndReturnEmptyStatisticData(res, filteredRequest, next);
      return;
    }
    // Build filter
    const filter = await StatisticService.buildFilter(filteredRequest, req.tenant, req.user, authorizations);
    // Get Stats
    const transactionStats = await StatisticsStorage.getUserStats(
      req.tenant, filter, StatsGroupBy.CONSUMPTION);
    // Convert
    const transactions = StatisticService.convertToGraphData(
      transactionStats, StatsDataCategory.USER);
    // Return data
    await StatisticService.buildAndReturnStatisticData(req, res, transactions, filteredRequest, authorizations, next);
  }

  static async handleGetUserUsageStatistics(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.STATISTICS,
      Action.READ, Entity.STATISTIC, MODULE_NAME, 'handleGetUserUsageStatistics');
    // Filter
    const filteredRequest = StatisticsValidatorRest.getInstance().validateStatisticsGet(req.query);
    // Check auth
    const authorizations = await AuthorizationService.checkAndGetStatisticsAuthorizations(req.tenant, req.user, Action.READ, filteredRequest);
    if (!authorizations.authorized) {
      StatisticService.buildAndReturnEmptyStatisticData(res, filteredRequest, next);
      return;
    }
    // Build filter
    const filter = await StatisticService.buildFilter(filteredRequest, req.tenant, req.user, authorizations);
    // Get Stats
    const transactionStats = await StatisticsStorage.getUserStats(
      req.tenant, filter, StatsGroupBy.USAGE);
    // Convert
    const transactions = StatisticService.convertToGraphData(
      transactionStats, StatsDataCategory.USER);
    // Return data
    await StatisticService.buildAndReturnStatisticData(req, res, transactions, filteredRequest, authorizations, next);
  }

  static async handleGetUserInactivityStatistics(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.STATISTICS,
      Action.READ, Entity.STATISTIC, MODULE_NAME, 'handleGetUserInactivityStatistics');
    // Filter
    const filteredRequest = StatisticsValidatorRest.getInstance().validateStatisticsGet(req.query);
    // Check auth
    const authorizations = await AuthorizationService.checkAndGetStatisticsAuthorizations(req.tenant, req.user, Action.READ, filteredRequest);
    if (!authorizations.authorized) {
      StatisticService.buildAndReturnEmptyStatisticData(res, filteredRequest, next);
      return;
    }
    // Build filter
    const filter = await StatisticService.buildFilter(filteredRequest, req.tenant, req.user, authorizations);
    // Get Stats
    const transactionStats = await StatisticsStorage.getUserStats(
      req.tenant, filter, StatsGroupBy.INACTIVITY);
    // Convert
    const transactions = StatisticService.convertToGraphData(
      transactionStats, StatsDataCategory.USER);
    // Return data
    await StatisticService.buildAndReturnStatisticData(req, res, transactions, filteredRequest, authorizations, next);
  }

  static async handleGetUserTransactionsStatistics(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.STATISTICS,
      Action.READ, Entity.STATISTIC, MODULE_NAME, 'handleGetUserTransactionsStatistics');
    // Filter
    const filteredRequest = StatisticsValidatorRest.getInstance().validateStatisticsGet(req.query);
    // Check auth
    const authorizations = await AuthorizationService.checkAndGetStatisticsAuthorizations(req.tenant, req.user, Action.READ, filteredRequest);
    if (!authorizations.authorized) {
      StatisticService.buildAndReturnEmptyStatisticData(res, filteredRequest, next);
      return;
    }
    // Build filter
    const filter = await StatisticService.buildFilter(filteredRequest, req.tenant, req.user, authorizations);
    // Get Stats
    const transactionStats = await StatisticsStorage.getUserStats(
      req.tenant, filter, StatsGroupBy.TRANSACTIONS);
    // Convert
    const transactions = StatisticService.convertToGraphData(
      transactionStats, StatsDataCategory.USER);
    // Return data
    await StatisticService.buildAndReturnStatisticData(req, res, transactions, filteredRequest, authorizations, next);
  }

  static async handleGetUserPricingStatistics(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.STATISTICS,
      Action.READ, Entity.STATISTIC, MODULE_NAME, 'handleGetUserPricingStatistics');
    // Filter
    const filteredRequest = StatisticsValidatorRest.getInstance().validateStatisticsGet(req.query);
    // Check auth
    const authorizations = await AuthorizationService.checkAndGetStatisticsAuthorizations(req.tenant, req.user, Action.READ, filteredRequest);
    if (!authorizations.authorized) {
      StatisticService.buildAndReturnEmptyStatisticData(res, filteredRequest, next);
      return;
    }
    // Build filter
    const filter = await StatisticService.buildFilter(filteredRequest, req.tenant, req.user, authorizations);
    // Get Stats
    const transactionStats = await StatisticsStorage.getUserStats(
      req.tenant, filter, StatsGroupBy.PRICING);
    // Convert
    const transactions = StatisticService.convertToGraphData(
      transactionStats, StatsDataCategory.USER);
    // Return data
    await StatisticService.buildAndReturnStatisticData(req, res, transactions, filteredRequest, authorizations, next);
  }

  static async handleExportStatistics(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    // Check if component is active
    UtilsService.assertComponentIsActiveFromToken(req.user, TenantComponents.STATISTICS,
      Action.READ, Entity.STATISTIC, MODULE_NAME, 'handleExportStatistics');
    // Filter
    const filteredRequest = StatisticsValidatorRest.getInstance().validateStatisticsExport(req.query);
    // Check auth
    const authorizations = await AuthorizationService.checkAndGetStatisticsAuthorizations(req.tenant, req.user, Action.READ, filteredRequest);
    if (!authorizations.authorized) {
      StatisticService.buildAndReturnEmptyStatisticData(res, filteredRequest, next);
      return;
    }
    // Build filter
    const filter = await StatisticService.buildFilter(filteredRequest, req.tenant, req.user, authorizations);
    // Decisions
    let groupBy: string;
    switch (filteredRequest.DataType) {
      case StatsDataType.CONSUMPTION:
        groupBy = StatsGroupBy.CONSUMPTION;
        break;
      case StatsDataType.USAGE:
        groupBy = StatsGroupBy.USAGE;
        break;
      case StatsDataType.INACTIVITY:
        groupBy = StatsGroupBy.INACTIVITY;
        break;
      case StatsDataType.TRANSACTION:
        groupBy = StatsGroupBy.TRANSACTIONS;
        break;
      case StatsDataType.PRICING:
        groupBy = StatsGroupBy.PRICING;
        break;
      default:
        groupBy = StatsGroupBy.CONSUMPTION;
    }
    // Query data
    let transactionStats: ChargingStationStats[] | UserStats[];
    if (filteredRequest.DataCategory === StatsDataCategory.CHARGING_STATION) {
      transactionStats = await StatisticsStorage.getChargingStationStats(req.tenant, filter, groupBy);
    } else {
      transactionStats = await StatisticsStorage.getUserStats(req.tenant, filter, groupBy);
    }
    // Set the attachement name
    res.attachment('exported-' + filteredRequest.DataType.toLowerCase() + '-statistics.csv');
    // Build the result
    const dataToExport = StatisticService.convertToCSV(transactionStats, filteredRequest.DataCategory,
      filteredRequest.DataType, filteredRequest.Year, filteredRequest.DataScope);
    // Send
    res.write(dataToExport);
    // End of stream
    res.end();
  }

  static async buildFilter(filteredRequest: HttpStatisticsGetRequest, tenant: Tenant, userToken: UserToken, authorizations: AuthorizationFilter): Promise<StatisticFilter> {
    // Only completed transactions
    let filter: StatisticFilter = { stop: { $exists: true } };
    // Date
    if ('Year' in filteredRequest) {
      if (filteredRequest.Year > 0) {
        filter.startDateTime = moment().year(filteredRequest.Year).startOf('year').toDate();
        filter.endDateTime = moment().year(filteredRequest.Year).endOf('year').toDate();
      }
    } else {
      // Current year
      filter.startDateTime = moment().startOf('year').toDate();
      filter.endDateTime = moment().endOf('year').toDate();
    }
    // DateFrom
    if (filteredRequest.StartDateTime) {
      filter.startDateTime = filteredRequest.StartDateTime;
    }
    // DateUntil
    if (filteredRequest.EndDateTime) {
      filter.endDateTime = filteredRequest.EndDateTime;
    }
    // Site
    if (filteredRequest.SiteID) {
      filter.siteIDs = filteredRequest.SiteID.split('|');
    }
    // Site Area
    if (filteredRequest.SiteAreaID) {
      filter.siteAreaIDs = filteredRequest.SiteAreaID.split('|');
    }
    // Charge Box
    if (filteredRequest.ChargingStationID) {
      filter.chargeBoxIDs = filteredRequest.ChargingStationID.split('|');
    }
    // DataScope
    if (filteredRequest.DataScope === StatsDataScope.TOTAL || !filteredRequest.DataScope) {
      filter.dataScope = StatsDataScope.MONTH;
    } else {
      filter.dataScope = filteredRequest.DataScope;
    }
    // User
    if (filteredRequest.UserID) {
      filter.userIDs = filteredRequest.UserID.split('|');
    }
    // Override filter with authorizations
    filter = { ...filter, ...authorizations.filters };
    // Remove site filter in case own user search
    if (!filteredRequest.SiteID && filter.userIDs && filter.userIDs.length === 1 && filter.userIDs[0] === userToken.id) {
      filter.siteIDs = [];
    }
    return filter;
  }

  static convertToGraphData(transactionStats: ChargingStationStats[] | UserStats[], dataCategory: string, dataScope: StatsDataScope = StatsDataScope.MONTH): any[] {
    const transactions: Record<string, number>[] = [];
    // Create
    if (transactionStats && transactionStats.length > 0) {
      // Create
      let period = -1;
      let unit: string;
      let transaction;
      let userName: string;
      for (const transactionStat of transactionStats) {
        const stat = transactionStat[dataScope];
        // Init
        if (transactionStat.unit && (unit !== transactionStat.unit)) {
          // Set
          period = stat;
          unit = transactionStat.unit;
          // Create new
          transaction = {};
          transaction[dataScope] = typeof stat === 'number' ? stat - 1 : stat;
          transaction.unit = transactionStat.unit;
          // Add
          if (transaction) {
            transactions.push(transaction);
          }
        }
        if (period !== stat) {
          // Set
          period = stat;
          // Create new
          transaction = {};
          transaction[dataScope] = typeof stat === 'number' ? stat - 1 : stat;
          if (transactionStat.unit) {
            unit = transactionStat.unit;
            transaction.unit = transactionStat.unit;
          }
          // Add
          if (transaction) {
            transactions.push(transaction);
          }
        }
        // Set key figure (total)
        if (dataCategory === StatsDataCategory.CHARGING_STATION) {
          const chargingStationStats = transactionStat as ChargingStationStats;
          transaction[chargingStationStats.chargeBox] = chargingStationStats.total;
        } else {
          const userStats = transactionStat as UserStats;
          // We can have duplicate user names, like 'Unknown'
          userName = Utils.buildUserFullName(userStats.user, false, false);
          if (userName in transaction) {
            transaction[userName] += userStats.total;
          } else {
            transaction[userName] = userStats.total;
          }
        }
      }
    }
    return transactions;
  }

  static getPricingCell(transaction: ChargingStationStats | UserStats, numberOfTransactions: number): string[] {
    if (transaction.unit) {
      return [numberOfTransactions.toString(), transaction.unit];
    }
    return [numberOfTransactions.toString(), ' '];
  }

  // Build header row
  static getYearAndMonthCells(year: number | string, dataScope?: StatsDataScope): string {
    if (year && year !== '0') {
      const yearHeader = StatsDataScope.YEAR;
      if (dataScope === StatsDataScope.MONTH) {
        return [yearHeader, StatsDataScope.MONTH].join(Constants.CSV_SEPARATOR);
      }
      return yearHeader;
    }
  }

  // Build dataType cells
  static getDataTypeCells = (dataType: StatsDataType): string => {
    switch (dataType) {
      case StatsDataType.CONSUMPTION:
        return 'consumption';
      case StatsDataType.USAGE:
        return 'usage';
      case StatsDataType.INACTIVITY:
        return 'inactivity';
      case StatsDataType.TRANSACTION:
        return 'numberOfSessions';
      case StatsDataType.PRICING:
        return ['price', 'priceUnit'].join(Constants.CSV_SEPARATOR);
      default:
        return '';
    }
  };

  static convertToCSV(transactionStats: ChargingStationStats[] | UserStats[],
    dataCategory: StatsDataCategory, dataType: StatsDataType, year: number | string, dataScope?: StatsDataScope): string {
    const headers = [
      dataCategory === StatsDataCategory.CHARGING_STATION ? 'chargingStation' : 'user',
      StatisticService.getYearAndMonthCells(year, dataScope),
      StatisticService.getDataTypeCells(dataType)
    ];
    let index: number;
    const transactions = [];
    if (transactionStats && transactionStats.length > 0) {
      for (const transactionStat of transactionStats) {
        if (!year || year === '0' || !dataScope || (dataScope && dataScope !== StatsDataScope.MONTH)) {
          // Annual or overall values
          transactionStat.month = 0;
          index = -1;
          if (transactions && transactions.length > 0) {
            if (dataCategory === StatsDataCategory.CHARGING_STATION) {
              const chargingStationStats = transactionStat as ChargingStationStats;
              index = transactions.findIndex((record) => {
                if (!record.unit || !transactionStat.unit) {
                  return (record.chargeBox === chargingStationStats.chargeBox);
                }
                return ((record.chargeBox === chargingStationStats.chargeBox)
                  && (record.unit === chargingStationStats.unit));
              });
            } else {
              const userStats = transactionStat as UserStats;
              index = transactions.findIndex((record) => {
                if (!record.unit || !userStats.unit) {
                  return ((record.user.name === userStats.user.name)
                    && (record.user.firstName === userStats.user.firstName));
                }
                return ((record.user.name === userStats.user.name)
                  && (record.user.firstName === userStats.user.firstName)
                  && (record.unit === userStats.unit));
              });
            }
          }
          if (index < 0) {
            transactions.push(transactionStat);
          } else {
            transactions[index].total += transactionStat.total;
          }
        } else if (dataCategory === StatsDataCategory.CHARGING_STATION) {
          const chargingStationStats = transactionStat as ChargingStationStats;
          transactions.push(chargingStationStats);
        } else {
          const userStats = transactionStat as UserStats;
          // Treat duplicate names (like 'Unknown')
          index = transactions.findIndex((record) => {
            if (!record.unit || !userStats.unit) {
              return ((record.month === userStats.month)
                && (record.user.name === userStats.user.name)
                && (record.user.firstName === userStats.user.firstName));
            }
            return ((record.month === userStats.month)
              && (record.user.name === userStats.user.name)
              && (record.user.firstName === userStats.user.firstName)
              && (record.unit === userStats.unit));
          });
          if (index < 0) {
            transactions.push(userStats);
          } else {
            transactions[index].total += userStats.total;
          }
        }
      }
      if (dataCategory === StatsDataCategory.CHARGING_STATION) {
        // Sort by Charging Station and month
        transactions.sort((rec1, rec2) => {
          if (rec1.chargeBox > rec2.chargeBox) {
            return 1;
          }
          if (rec1.chargeBox < rec2.chargeBox) {
            return -1;
          }
          // Charging Station is the same, now compare month
          if (rec1.month > rec2.month) {
            return 1;
          }
          if (rec1.month < rec2.month) {
            return -1;
          }
          if (rec1.unit && rec2.unit) {
            if (rec1.unit > rec2.unit) {
              return 1;
            }
            if (rec1.unit < rec2.unit) {
              return -1;
            }
          }
          return 0;
        });
      } else {
        // Sort by user name and month
        transactions.sort((rec1, rec2) => {
          if (rec1.user.name > rec2.user.name) {
            return 1;
          }
          if (rec1.user.name < rec2.user.name) {
            return -1;
          }
          if (rec1.user.firstName > rec2.user.firstName) {
            return 1;
          }
          if (rec1.user.firstName < rec2.user.firstName) {
            return -1;
          }
          // Name and first name are identical, now compare month
          if (rec1.month > rec2.month) {
            return 1;
          }
          if (rec1.month < rec2.month) {
            return -1;
          }
          if (rec1.unit && rec2.unit) {
            if (rec1.unit > rec2.unit) {
              return 1;
            }
            if (rec1.unit < rec2.unit) {
              return -1;
            }
          }
          return 0;
        });
      }
      // Now build the export file
      let numberOfTransactions: number;
      const rows = transactions.map((transaction) => {
        numberOfTransactions = Utils.truncTo(transaction.total, 2);
        // Use raw numbers - it makes no sense to format numbers here,
        // anyway only locale 'en-US' is supported here as could be seen by:
        // const supportedLocales = Intl.NumberFormat.supportedLocalesOf(['fr-FR', 'en-US', 'de-DE']);
        const row = [
          dataCategory === StatsDataCategory.CHARGING_STATION ? transaction.chargeBox : Utils.buildUserFullName(transaction.user, false),
          year && year !== '0' ? year : '',
          transaction.month > 0 ? transaction.month : '',
          dataType === StatsDataType.PRICING ? StatisticService.getPricingCell(transaction, numberOfTransactions) : numberOfTransactions.toString()
        ].map((value) => Utils.escapeCsvValue(value));
        return row;
      }).join(Constants.CR_LF);
      return [headers, rows].join(Constants.CR_LF);
    }
  }

  // Function that allows retrocompatibility: empty array or empty data source
  private static buildAndReturnEmptyStatisticData(res: Response, filteredRequest: HttpStatisticsGetRequest, next: NextFunction) {
    // Empty data result
    if (filteredRequest.WithAuth) {
      UtilsService.sendEmptyDataResult(res, next);
      return;
    }
    // Empty array
    UtilsService.sendEmptyArray(res, next);
    return;
  }

  // Function that allows retrocompatibility: would either return raw statistic values or convert it into a datasource with auth flags
  private static async buildAndReturnStatisticData(req: Request, res: Response, data: any, filteredRequest: HttpStatisticsGetRequest, authorizations: AuthorizationFilter, next: NextFunction) {
    // Check return type and add auth
    if (filteredRequest.WithAuth) {
      const transactionsDataResult: StatisticDataResult = {
        result: data,
        count: data.length
      }
      // Add auth
      await AuthorizationService.addStatisticsAuthorizations(req.tenant, req.user, transactionsDataResult, authorizations);
      res.json(transactionsDataResult);
      next();
    }
    else {
      res.json(data);
      next();
    }
  }
}
