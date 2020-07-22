// Extarnal Libs

// External Files
import Account = require('../models/account')
import Block = require('../models/block')
import crm = require('../services/crm')
import logService = require('../services/logger')
import mailer = require('../services/mailer')

// Interfaces
import { IAccountParams, IAccountPublic, IAccountUpdateParams } from '../interfaces/account'

// Logger setup
const logger = new logService('Account Controller')

class AccountController {
  public static async create(params: IAccountParams): Promise<string> {
    try {
      const _account = new Account(params)
      const _accountUUID = await _account.store()

      const { contactEmail } = params
      await mailer.sendWelcomeEmail(contactEmail, _accountUUID)
      crm.addNewUser(contactEmail, _accountUUID)

      logger.logAndSlack(`Account created for ${contactEmail}: ${_accountUUID}`)
      return _accountUUID
    } catch (error) {
      logger.error(`Account creation failed: ${error.message}`)
      throw error
    }
  }

  public static async update(uuid: string, data: Partial<IAccountUpdateParams>): Promise<IAccountPublic> {
    try {
      const _account = await Account.get(uuid)

      await _account.update(data)

      const _accountDetails = _account.sanitize()

      logger.info('Account updated')
      return _accountDetails
    } catch (error) {
      logger.error(`Account update failed: ${error.message}`)
      throw error
    }
  }

  public static async get(uuid: string): Promise<IAccountPublic> {
    try {
      const _account = await Account.get(uuid)
      const _accountDetails = _account.sanitize()

      logger.info('Account retrieved')
      return _accountDetails
    } catch (error) {
      logger.error(`Account retrieval failed: ${error.message}`)
      throw error
    }
  }

  public static async delete(uuid: string): Promise<string> {
    try {
      const _account = await Account.get(uuid)
      const _blocks = await _account.getBlocks()

      logger.info(`Deleting account: ${uuid}`)
      for (const _blockName of _blocks) {
        logger.info(`Deleting block ${_blockName} in account: ${uuid}`)
        const _block = await Block.get(uuid, _blockName)
        await _block.delete()
      }
      await _account.delete()

      logger.info(`Account: ${uuid} deleted`)
      return `Your Pantry has been deleted!`
    } catch (error) {
      logger.error(`Account deletion failed: ${error.message}`)
      throw error
    }
  }
}

export = AccountController
