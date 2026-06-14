import fs from 'fs'
import path from 'path'
import sys from './sys.js'
import { number, makeInMemoryStore } from './helper.js'
import { call, func, groupCache, addErr } from './function.js'
import { bell } from '../cmd/interactive.js'
import { db, gm, gc, save, get } from './db/data.js'

const store = makeInMemoryStore(),
      trialBuff = new Map()

const config = './system/set/config.json',
      readmore = '\u200E'.repeat(4e3 + 1),
      cfg = () => JSON.parse(fs.readFileSync(config, 'utf-8')),
      getCfg = {
        prefix: () => cfg().botSetting.menuSetting.prefix || '.',
        botName: () => cfg().botSetting.botName,
        botFullName: () => cfg().botSetting.botFullName,
        logic: () => cfg().botSetting.logic,
        head: () => cfg().botSetting.menuSetting.frame.head,
        body: () => cfg().botSetting.menuSetting.frame.body,
        foot: () => cfg().botSetting.menuSetting.frame.foot,
        opb: () => cfg().botSetting.menuSetting.brackets?.[0],
        clb: () => cfg().botSetting.menuSetting.brackets?.[1],
        line: () => cfg().botSetting.menuSetting.line,
        btn: () => cfg().botSetting.menuSetting.btn,
        idCh: () => cfg().botSetting.menuSetting.idCh,
        thumbnail: () => cfg().botSetting.menuSetting.thumbnail,
        isGroup: () => cfg().botSetting.isGroup,
        ownerName: () => cfg().ownerSetting.ownerName,
        authBlock: () => cfg().ownerSetting.authBlock,
        linkPriview: () => cfg().ownerSetting.linkPriview,
        ownerNumber: () => cfg().ownerSetting.ownerNumber,
        public: () => cfg().ownerSetting.public,
        loadChat: () => cfg().ownerSetting.loadChat,
        sendType: () => cfg().botSetting.sendType,
        footer: () => cfg().botSetting.menuSetting.footer,
        termaiWeb: () => cfg().apikey.termai.web,
        termaiKey: () => cfg().apikey.termai.key,
      },
      gtr = {
        ...Object.fromEntries(Object.keys(getCfg).map(k => [k, getCfg[k]])),
        __cfg: Object.keys(getCfg),
        trialBuff,
        addErr,
        db,
        gm,
        gc,
        save,
        get,
        groupCache,
        number,
        readmore,
        store,
        call,
        func,
        bell,
        log: (...a) => console.log(...a),
        err: (...a) => console.error(...a)
      }

Object.assign(gtr, sys)

for (const k in gtr) 
  k !== '__cfg' && Object.defineProperty(global, k, {
    enumerable: true,
    configurable: true,
    get: () => gtr.__cfg.includes(k) && typeof gtr[k] === 'function'
      ? gtr[k]()
      : gtr[k]
  });

export default global