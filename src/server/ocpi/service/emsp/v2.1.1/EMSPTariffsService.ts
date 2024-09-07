import { NextFunction, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

import AppError from '../../../../../exception/AppError';
import { HTTPError } from '../../../../../types/HTTPError';
import Logging from '../../../../../utils/Logging';
import { OCPIStatusCode } from '../../../../../types/ocpi/OCPIStatusCode';
import { OCPITariff } from '../../../../../types/ocpi/OCPITariff';
import OCPIUtils from '../../../OCPIUtils';
import { PricingSettingsType } from '../../../../../types/Setting';
import { ServerAction } from '../../../../../types/Server';
import SettingStorage from '../../../../../storage/mongodb/SettingStorage';
import { StatusCodes } from 'http-status-codes';
import Utils from '../../../../../utils/Utils';

const MODULE_NAME = 'EMSPTariffsService';

export default class EMSPTariffsService {
  public static async handleGetTariff(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    const { tenant } = req;
    const urlSegment = req.path.substring(1).split('/');
    // Remove action
    urlSegment.shift();
    // Get filters
    const countryCode = urlSegment.shift();
    const partyId = urlSegment.shift();
    const tariffId = urlSegment.shift();
    if (!countryCode || !partyId || !tariffId) {
      throw new AppError({
        module: MODULE_NAME, method: 'handleGetTariff', action,
        errorCode: HTTPError.GENERAL_ERROR,
        message: 'Missing request parameters',
        ocpiError: OCPIStatusCode.CODE_2001_INVALID_PARAMETER_ERROR
      });
    }
    // TODO: the whole tariff system should be implemented, including adding database object for tariffs
    let tariff: OCPITariff = {} as OCPITariff;
    if (tenant.components?.pricing?.active) {
      // Get simple pricing settings
      const pricingSettings = await SettingStorage.getPricingSettings(tenant);
      if (pricingSettings.type === PricingSettingsType.SIMPLE && pricingSettings.simple) {
        tariff = OCPIUtils.convertSimplePricingSettingToOcpiTariff(pricingSettings.simple);
      } else {
        throw new AppError({
          module: MODULE_NAME, method: 'handleGetTariff', action,
          errorCode: StatusCodes.NOT_FOUND,
          message: `Simple Pricing setting not found in Tenant ${Utils.buildTenantName(tenant)}`,
          ocpiError: OCPIStatusCode.CODE_3000_GENERIC_SERVER_ERROR
        });
      }
    }
    res.json(OCPIUtils.success(tariff));
    next();
  }

  // TODO: The whole function should be changed.
  public static async handlePutTariff(action: ServerAction, req: Request, res: Response, next: NextFunction): Promise<void> {
    const { tenant } = req;
    const urlSegment = req.path.substring(1).split('/');
    // Remove action
    urlSegment.shift();
    // Get filters
    const countryCode = urlSegment.shift();
    const partyId = urlSegment.shift();
    const tariffId = urlSegment.shift();
    if (!countryCode || !partyId || !tariffId) {
      throw new AppError({
        module: MODULE_NAME, method: 'handlePutTariff', action,
        errorCode: HTTPError.GENERAL_ERROR,
        message: 'Missing request parameters',
        ocpiError: OCPIStatusCode.CODE_2001_INVALID_PARAMETER_ERROR
      });
    }
    let tariff: OCPITariff = {} as OCPITariff;
    if (req.body) {
      tariff = req.body as OCPITariff;
      // Update the last_updated field to the current time
      tariff.last_updated = new Date()
    }
    // TODO: check if the tariff exists in the database and update it if it does or create a new one if it doesn't
    // Load the tariffs from the json file
    const tariffsFilePath = path.join(__dirname, 'Tariffs.json');
    let storedTariffs: OCPITariff[] = [];
    try {
      const tariffsData = await fs.readFile(tariffsFilePath, 'utf-8');
      storedTariffs = JSON.parse(tariffsData);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new AppError({
          module: MODULE_NAME, method: 'handlePutTariff', action,
          errorCode: HTTPError.GENERAL_ERROR,
          message: 'Error reading Tariffs.json file',
          ocpiError: OCPIStatusCode.CODE_3000_GENERIC_SERVER_ERROR
        });
      }
      // If file doesn't exist, we'll start with an empty array
    }
    // update the tariff if it exists or add it to the list if it doesn't
    const index = storedTariffs.findIndex((t) => t.id === tariff.id);

    if (index !== -1) {
      storedTariffs[index] = tariff;
      await Logging.logDebug({
        tenantID: tenant.id,
        action: action,
        module: MODULE_NAME, method: 'handlePutTariff',
        message: `Tariff ID ${tariff.id} has been updated in the database`,
        detailedMessages: { tariff }
      });
    } else {
      storedTariffs.push(tariff);
      await Logging.logDebug({
        tenantID: tenant.id,
        action: action,
        module: MODULE_NAME, method: 'handlePutTariff',
        message: `Tariff ID ${tariff.id} has been added to the database`,
        detailedMessages: { tariff }
      });
    }
    // Save the tariffs to the JSON file
    try {
      await fs.writeFile(tariffsFilePath, JSON.stringify(storedTariffs, null, 2));
    } catch (error) {
      throw new AppError({
        module: MODULE_NAME, method: 'handlePutTariff', action,
        errorCode: HTTPError.GENERAL_ERROR,
        message: 'Error writing to Tariffs.json file',
        ocpiError: OCPIStatusCode.CODE_3000_GENERIC_SERVER_ERROR
      });
    }
    
    res.json(OCPIUtils.success(tariff));
    next();
  }
}

