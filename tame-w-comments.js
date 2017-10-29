/*!
 * TAME [TwinCAT ADS Made Easy] V4.2 171029
 * 
 * Copyright (c) 2009-2017 Thomas Schmidt; t.schmidt.p1 at freenet.de
 * 
 * Dual licensed under:
 *  MIT - http://www.opensource.org/licenses/mit-license
 *  GPLv3 - http://www.opensource.org/licenses/GPL-3.0
 * 
 */


/*jslint plusplus: true, bitwise: true */


(function () {

    "use strict";

    /**
     * This is the global TAME object. Used as a namespace to store values and functions.
     */
    var TAME = {
        //Version
        version: 'V4.2 171029',
        //Names of days and months. This is for the formatted output of date values. You can
        //simply add your own values if you need.
        weekdShortNames: {
            ge: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        },
        weekdLongNames: {
            ge: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
            en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        monthsShortNames: {
            ge: ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
            en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dez']
        },
        monthsLongNames: {
            ge: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
            en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        }
    };


    /**
     * The constructor function for the Web Service Client.
     * 
     * @param {Object} service  Contains the paramters of the Web Service.
     */
    TAME.WebServiceClient = function (service) {


        //======================================================================================
        //                            Things which should come first
        //======================================================================================

        /**
         * Wrapper for console messages.
         * 
         * @param {Mixed} message  The message to be logged.
         */
        function log(message) {
            try {
                window.console.log(message);
            } catch (e) {
                //fallback
                alert(message);
            }
        }

        //Log version
        log('TAME library version: ' + TAME.version);



        //======================================================================================
        //                                Initialize Variables
        //======================================================================================

        var instance = this,

            //Index-Group's
            indexGroups = {
                M: 16416,    //PLC memory range(%M field), READ_M - WRITE_M
                MX: 16417,   //PLC memory range(%MX field), READ_MX - WRITE_MX
                DB: 16448,   //Data range
                I: 61472,    //PLC process diagram of the physical inputs(%I field), READ_I - WRITE_I
                IX: 61473,   //PLC process diagram of the physical inputs(%IX field), READ_IX - WRITE_IX
                Q: 61488,    //PLC process diagram of the physical outputs(%Q field), READ_Q - WRITE_Q
                QX: 61489,   //PLC process diagram of the physical outputs(%QX field), READ_QX - WRITE_QX
                Upload: 61451,      //Contains the symbol information
                UploadInfo: 61452,  //Length and number of the symbol information        
                HandleByName: 61443,
                ValueByHandle: 61445,
                ReleaseHandle: 61446,
                SumRd: 61568,       //SumUpReadRequest
                SumWr: 61569,       //SumUpWriteRequest
                SumRdWr: 61570      //SumUpReadWriteRequest
            },

            //Lenght of PLC data types in bytes.
            plcTypeLen = {
                BOOL: 1,
                BYTE: 1,
                USINT: 1,
                SINT: 1,
                WORD: 2,
                UINT: 2,
                INT: 2,
                INT16: 2,
                INT1DP: 2,
                INT2DP: 2,
                DWORD: 4,
                UDINT: 4,
                DINT: 4,
                TIME: 4,          //time base in PLC: milliseconds
                TOD: 4,           //time base in PLC: milliseconds
                TIME_OF_DAY: 4,   //TwinCAT3, time base in PLC: milliseconds
                DATE: 4,          //time base in PLC: seconds
                DT: 4,            //time base in PLC: seconds
                DATE_AND_TIME: 4, //TwinCAT3, time base in PLC: seconds
                POINTER: 4,
                REAL: 4,
                LREAL: 8,
                STRING: 80,    //without termination
                EndStruct: 0   //should be 0!
            },

            //ADS states
            adsStates = [
                "INVALID",
                "IDLE",
                "RESET",
                "INIT",
                "START",
                "RUN",
                "STOP",
                "SAVECFG",
                "POWERGOOD",
                "ERROR",
                "SHUTDOWN",
                "SUSPEND",
                "RESUME",
                "CONFIG",
                "RECONFIG"
            ],

            //Set language for names of days and months, default is german.
            lang = (typeof service.language === 'string') ? service.language : 'ge',

            //Generate a Base64 alphabet for the encoder. Using an array or object to
            //store the alphabet the en-/decoder runs faster than with the commonly
            //used string. At least with the browsers of 2009. ;-)
            b64Enc = (function () {
                var ret = {},
                    str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
                    i;
                for (i = 0; i < str.length; i++) {
                    ret[i] = str.charAt(i);
                }
                return ret;
            }()),

            //Generate a Base64 alphabet for the decoder.
            b64Dec = (function () {
                var ret = {},
                    str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
                    i;
                for (i = 0; i < str.length; i++) {
                    ret[str.charAt(i)] = i;
                }
                return ret;
            }()),


            //Alignment
            alignment = 0,

            //Array for the request acknowledgement counter.
            currReq = [0],

            //The Symbol Table for accessing variables per name.
            symTable = {},
            //symTableOk = false,
            dataTypeTable = {},
            //dataTypeTableOk = false,
            serviceInfo = {},

            //Variables of the UploadInfo 
            symbolCount = 0, uploadLength = 0,

            //Object to store the handles
            handleCache = {},
            handleNames = [];




        //======================================================================================
        //                                Check Client Parameter
        //======================================================================================

        //URL of the TcAdsWebService.dll
        if (typeof service.serviceUrl !== 'string') {
            log('TAME library error: Service URL is not a string!');
            return;
        }

        //AMS NetID of the PLC
        if (typeof service.amsNetId !== 'string' && (typeof service.configFileUrl !== 'string' || service.dontFetchSymbols === true)) {
            log('TAME library error: NetId is not defined and there is no URL for fetching the TPY file or fetching the symbols is deactivated!');
            return;
        }

        //AMS Port Number of the Runtime System
        if (service.amsPort === undefined && (typeof service.configFileUrl !== 'string' || service.dontFetchSymbols === true)) {
            service.amsPort = '801';
            log('TAME library warning: AMS port number is not set! Default port 801 will be used.');
        } else if (typeof service.amsPort === 'number') {
            log('TAME library warning: AMS port number is not a string! Trying to convert it.');
            service.amsPort = service.amsPort.toString(10);
        }
        if (parseInt(service.amsPort, 10) < 801 || parseInt(service.amsPort, 10) > 891) {
            log('TAME library error: AMS Port Number (' + parseInt(service.amsPort, 10) + ') is out of range (801-891)!');
            return;
        }

        //Data alignment, x86 and TC2 uses a 1 byte alignment, for an ARM and TC2 set it to 4 and
        //for TC3 generally to 8; 
        //dataAlign4 is depricated
        if (service.dataAlign4 === true) {
            alignment = 4;
        } else if (service.alignment === undefined && (typeof service.configFileUrl !== 'string' || service.dontFetchSymbols === true)) {
            alignment = 1;
        } else if (typeof service.alignment === 'string') {
            alignment = parseInt(service.alignment, 10);
        } else if (typeof service.alignment === 'number') {
            alignment = service.alignment;
        }

        //Global synchronous XMLHTTPRequests
        if (service.syncXmlHttp === true) {
            log('TAME library info: The "syncXmlHttp" parameter is set to true. Synchronous XMLHttpRequests will be used by default.');
        } else {
            //Don't let it undefined
            service.syncXmlHttp === false;
        }

        //Username/password
        if (typeof service.serviceUser === 'string' && typeof service.servicePassword === 'string') {
            log('TAME library info: Username and password set. Authenticated requests will be used.');
        } else {
            service.serviceUser = null;
            service.servicePassword = null;
        }

        //Global use of handles
        if (service.useHandles === true) {
            log('TAME library info: The "useHandles" parameter is set to true. Handles will be used by default.');
        }

        //Don't check for missing data types (thats a problem with some TwinCAT libs)
        if (service.skipMissingTypes === true) {
            log('TAME library info: The "skipMissingTypes" parameter is set to true. TAME just drops a log message if there are TwinCAT libs with missing data types.');
        } else {
            service.skipMissingTypes = false;
        }

        //Cyclic ADS checks (experimental).
        if (!isNaN(service.adsCheckInterval) && service.adsCheckInterval >= 1) {
            log('TAME library info: Cyclic ADS state checks enabled. Interval time: ' + service.adsCheckInterval + ' ms.');

        }



        //======================================================================================
        //                                Initialize Properties
        //======================================================================================

        //Set language specific names of days and months.
        this.dateNames = {
            weekdShort: TAME.weekdShortNames[lang],
            weekdLong: TAME.weekdLongNames[lang],
            monthsShort: TAME.monthsShortNames[lang],
            monthsLong: TAME.monthsLongNames[lang]
        };

        //Maximum string length.
        this.maxStringLen = 255;

        //Maximum count of dropped requests after a request
        //was not acknowledged (in conjunction with a reqest ID).
        this.maxDropReq = 10;

        //Check limits of numeric variables before sending them to the PLC
        this.useCheckBounds = true;

        //ADS states
        this.adsState = null;
        this.adsStateTxt = '';
        this.deviceState = null;

        //Ready states
        this.symTableReady = false;
        this.dataTypeTableReady = false;
        this.handleCacheReady = false;

        //XMLHttpRequest timeout
        this.xmlHttpReqTimeout = 5000;




        //======================================================================================
        //                                 Helper Functions
        //======================================================================================

        /**
         * Decode variable names passed as strings and return the object,
         * store data values if they are passed too.
         * 
         * @param {String} name     The name of a JavaScript variable or a property.
         * @param {Object} data     Data values to store in the variable/property.
         * @param {Object} obj      The object containing the property to store the data in. 
         *                          Used with createArrayDescriptor and createStructDescriptor 
         *                          for better performance.
         */
        function parseVarName(name, data, obj, prefix, suffix) {

            var arr = [],
                last = 0,
                a = [],
                i = 0;

            if (typeof name === 'number') {
                arr[0] = name.toString(10);
            } else if (typeof name === 'string') {
                arr = name.split('.');
            } else {
                log('TAME library error: Can\'t parse name of object/variable. Name is not a string or number!');
                log(name);
                return;
            }

            if (obj === undefined) {
                obj = window;
            }
            last = arr.length - 1;

            //Walk through the tiers
            while (i < last) {
                //Check if the passed name points to an array.
                if (arr[i].charAt(arr[i].length - 1) === ']') {
                    a = arr[i].substring(0, arr[i].length - 1).split('[');
                    obj = obj[a[0]][a[1]];
                } else {
                    //Create an array if object is not defined.
                    //This can happen when an array of structure is
                    //not defined.
                    if (obj[arr[i]] === undefined) {
                        obj[arr[i]] = [];
                    }
                    obj = obj[arr[i]];
                }
                i++;
            }

            //Last element
            if (arr[i].charAt(arr[i].length - 1) === ']') {
                //If last item of the name is an array
                a = arr[i].substring(0, arr[i].length - 1).split('[');
                obj = obj[a[0]];

                //Store data if passed.
                if (data !== undefined) {
                    if (typeof prefix === 'string') {
                        data = prefix + data;
                    }
                    if (typeof suffix === 'string') {
                        data = data + suffix;
                    }
                    obj[a[1]] = data;
                }
                return obj[a[1]];

            }

            //Store data if passed.
            if (data !== undefined) {
                if (typeof prefix === 'string') {
                    data = prefix + data;
                }
                if (typeof suffix === 'string') {
                    data = data + suffix;
                }
                obj[arr[i]] = data;
            }
            return obj[arr[i]];

        }


        /**
         * Check if a passed string length is valid.
         * 
         * @param {Number} len
         */
        function isValidStringLen(len) {
            if (len === undefined) {
                return false;
            }
            if (!isNaN(len) && len > 0 && len <= instance.maxStringLen) {
                return true;
            }
            log('TAME library error: User defined string length not valid! length: ' + len);
            log('Max. string length: ' + instance.maxStringLen);
            return false;
        }


        /**
         * The function returns the IndexGroup for a PLC variable address.
         * 
         * @param {Object} req          An object with the address or the name for the request.
         * @return {Number} indexGroup  The IndexGroup for the ADS request. 
         */
        function getIndexGroup(req) {
            var indexGroup;

            if (req.addr) {
                //Try to get the IndexGroup by address
                if (typeof req.addr === 'string' && req.addr.charAt(0) === '%') {
                    if (req.addr.charAt(2) === 'X') {
                        //Bit addresses.
                        indexGroup = indexGroups[req.addr.substr(1, 2)];
                    } else {
                        //Byte addresses.
                        indexGroup = indexGroups[req.addr.substr(1, 1)];
                    }
                } else {
                    log('TAME library error: Wrong address definition, should be a string and start with "%"!');
                    log(req);
                    return;
                }
            } else if (req.useHandle === true || service.useHandles === true && req.useHandle !== false) {
                //Get the IndexGroup for the Value By Handle Request
                indexGroup = indexGroups.ValueByHandle;
            } else if (req.symbolName) {
                //Try to get the IndexGroup by name
                if (typeof req.symbolName === 'string') {
                    try {
                        indexGroup = symTable[req.symbolName].indexGroup;
                    } catch (e) {
                        log('TAME library error: Can\'t get the IndexGroup for this request!');
                        log('TAME library error: Please check the variable name.');
                        log(e);
                        log(req);
                        return;
                    }
                } else {
                    log('TAME library error: Varible name should be a string!');
                    log(req);
                    return;
                }
            } else {
                log('TAME library error: No name, address or handle for the variable/request defined!');
                log(req);
                return;
            }

            if (isNaN(indexGroup)) {
                log('TAME library error: IndexGroup is not a number, check address or name definition of the variable/request!');
                log(req);
            }

            return indexGroup;
        }


        /**
         * The function returns the IndexOffset for a PLC variable address.
         * 
         * @param {Object} req          An object with the address or the name for the request.
         * @return {Number} indexOffset The IndexOffset for the ADS request. 
         */
        function getIndexOffset(req) {
            var indexOffset, numString = '', mxaddr = [], i, dataType, itemArray, splittedType, bitoffs, subitem;

            if (req.addr) {
                //Try to get the IndexOffset by address
                if (typeof req.addr === 'string' && req.addr.charAt(0) === '%') {
                    if (req.addr.charAt(2) === 'X') {
                        //Bit req.addresses.
                        numString = req.addr.substr(3);
                        mxaddr = numString.split('.');
                        indexOffset = parseInt(mxaddr[0], 10) * 8 + parseInt(mxaddr[1], 10);
                    } else {
                        //Byte addresses.
                        indexOffset = parseInt(req.addr.substr(3), 10);
                        //Address offset is used if only one item of an array
                        //should be sent.
                        if (typeof req.addrOffset === 'number') {
                            indexOffset += req.addrOffset;
                        }
                    }
                } else {
                    log('TAME library error: Wrong address definition, should be a string and start with "%"!');
                    log(req);
                    return;
                }
            } else if (req.useHandle === true || service.useHandles === true && req.useHandle !== false) {
                //Try to get the handle for this request
                if (instance.handleCacheReady === true) {
                    //Get handle code
                    indexOffset = handleCache[req.fullSymbolName];

                    if (isNaN(indexOffset)) {
                        log('TAME library error: Could not get the handle for this symbol name: ' + req.fullSymbolName);
                        log(req);
                        return;
                    }
                } else {
                    log('TAME library error: Could not get the handle for this request. Handle cache is not ready.');
                    log(req);
                    return;
                }
            } else if (req.symbolName) {
                //Try to get the IndexOffset by name.
                if (typeof req.symbolName === 'string') {
                    try {
                        //Get the offset from the symbol table
                        indexOffset = symTable[req.symbolName].indexOffset;

                        if (typeof req.symbolNameArrIdx === 'number') {
                            indexOffset += symTable[req.symbolName].itemSize * (req.symbolNameArrIdx - symTable[req.symbolName].arrStartIdx);
                        }

                        //Address offset is used if only one item of an array
                        //should be sent.
                        if (typeof req.addrOffset === 'number') {
                            indexOffset += req.addrOffset;
                        }
                        //Add a manually defined bit offset.
                        if (typeof req.offs === 'string') {
                            indexOffset += parseInt(req.offs, 10) / 8;
                        } else if (typeof req.offs === 'number') {
                            indexOffset += req.offs / 8;
                        }
                        //Get the bit offset if a subitem is given.
                        if (req.dataTypeNames.length > 0) {
                            itemArray = req.dataTypeNames;
                            dataType = symTable[req.symbolName].dataType;
                            //Go through the array with the subitems and add the offsets
                            for (i = 0; i < itemArray.length; i++) {
                                subitem = dataTypeTable[dataType].subItems[itemArray[i]];
                                indexOffset += subitem.bitOffset / 8;
                                //Calculate the offset.
                                if (typeof req.dataTypeArrIdx[i] === 'number') {
                                    indexOffset += subitem.itemSize * (req.dataTypeArrIdx[i] - subitem.arrStartIdx);
                                }
                                //Get the data type for the next round
                                dataType = dataTypeTable[dataType].subItems[itemArray[i]].dataType;
                            }
                        }

                    } catch (e) {
                        log('TAME library error: Can\'t get the IndexOffset for this request!');
                        log('TAME library error: Please check the variable definition (name/offs/subitem).');
                        log(e);
                        log(req);
                        return;
                    }
                } else {
                    log('TAME library error: Varible name should be a string!');
                    log(req);
                    return;
                }
            } else {
                log('TAME library error: Neither a name nor an address for the variable/request defined!');
                log(req);
                return;
            }

            if (isNaN(indexOffset)) {
                log('TAME library error: IndexOffset is not a number, check address or name definition of the variable/request.');
                log('IndexOffset: ' + indexOffset);
                log(req);
            }

            return indexOffset;
        }

        /**
         * The function parses the PLC variable name, looks in the symbol and data type table and 
         * returns an object with the necessary information.
         * 
         * @param {Object} item          An object with at least the address or the name for the request.
         * @return {Objecct} itemInfo    An object with the information about the item.
         * 
         */
        function getItemInformation(item) {
            var itemInfo = {}, arrPlcVarName, splitType;

            if (typeof item.name === 'string') {
                item.name = item.name.toUpperCase();
                arrPlcVarName = item.name.split('.');
            } else {
                //Return if no symbol name is given
                return itemInfo;
            };

            //Get the symbol name.
            itemInfo.fullSymbolName = item.name;
            if (arrPlcVarName[0] === '') {
                //Global variable
                itemInfo.symbolName = '.' + arrPlcVarName[1];
            } else {
                //Variable of an instance
                itemInfo.symbolName = arrPlcVarName[0] + '.' + arrPlcVarName[1];
            }
            //Cut an array index
            if (itemInfo.symbolName.charAt(itemInfo.symbolName.length - 1) === ']') {
                //Cut the array index and store it
                splitType = itemInfo.symbolName.substring(0, itemInfo.symbolName.length - 1).split('[');
                itemInfo.symbolName = splitType[0];
                itemInfo.symbolNameArrIdx = parseInt(splitType[1], 10);
            }


            //Leave the rest as an array and add it to the itemInfo
            itemInfo.dataTypeNames = arrPlcVarName.slice(2);

            var arr = [], typeArray, dataType, i;

            //Get information from the tables
            if (instance.symTableReady && instance.dataTypeTableReady && itemInfo.dataTypeNames.length > 0) {
                //Try to get the subitem type from the symbol table && data type table
                typeArray = itemInfo.dataTypeNames;
                dataType = symTable[itemInfo.symbolName].dataType;
                itemInfo.dataTypeArrIdx = [];
                //Go for the last subitem
                i = 0;

                do {
                    //Check if the subitem is an array
                    if (typeArray[i].charAt(typeArray[i].length - 1) === ']') {
                        //Cut the array index and store it in an extra array
                        splitType = typeArray[i].substring(0, typeArray[i].length - 1).split('[');
                        typeArray[i] = splitType[0];
                        itemInfo.dataTypeArrIdx[i] = parseInt(splitType[1], 10);
                    }

                    if (dataTypeTable[dataType].subItems[typeArray[i]].pointer === true) {
                        log('TAME library error: PLC variable ' + [typeArray[i]] + ' is a pointer! Can\'t get the variable value.');
                    }

                    //Get the type of the next subitem
                    if (i === typeArray.length - 1) {
                        break;
                    }
                    dataType = dataTypeTable[dataType].subItems[typeArray[i]].dataType;
                    i++;

                } while (i < typeArray.length);

                //Get the type of the subitem
                try {
                    if (item.type === undefined) {
                        itemInfo.type = dataTypeTable[dataType].subItems[typeArray[i]].type;
                    }

                    itemInfo.arrayLength = dataTypeTable[dataType].subItems[typeArray[i]].arrayLength;
                    itemInfo.arrayDataType = dataTypeTable[dataType].subItems[typeArray[i]].arrayDataType;
                    itemInfo.dataType = dataTypeTable[dataType].subItems[typeArray[i]].dataType;
                    itemInfo.itemSize = dataTypeTable[dataType].subItems[typeArray[i]].itemSize;

                    if (itemInfo.size === undefined) {
                        itemInfo.size = dataTypeTable[dataType].subItems[typeArray[i]].size;
                    }

                    itemInfo.bitOffset = dataTypeTable[dataType].subItems[typeArray[i]].bitOffset;
                    itemInfo.offs = item.offs;

                    if (itemInfo.type === 'STRING' || itemInfo.arrayDataType === 'STRING') {
                        itemInfo.stringLength = dataTypeTable[dataType].subItems[typeArray[i]].stringLength;
                        itemInfo.format = itemInfo.stringLength; //compatibility
                    } else if (typeof item.format === 'string') {
                        itemInfo.format = item.format;
                    } else if (typeof item.decPlaces === 'number') {
                        itemInfo.format = item.decPlaces;
                    } else if (typeof item.dp === 'number') {
                        itemInfo.format = item.dp;
                    }

                    if (itemInfo.dataTypeArrIdx[i] !== undefined && itemInfo.type === 'ARRAY') {
                        itemInfo.type = dataTypeTable[dataType].subItems[typeArray[i]].arrayDataType;
                        itemInfo.size = dataTypeTable[dataType].subItems[typeArray[i]].itemSize;
                    }

                } catch (e) {
                    log('TAME library error: A problem occured while reading a data type from the data type table!');
                    log(e);
                    log(item);
                }


            } else if (instance.symTableReady) {
                //Try to get the type from the symbol table
                if (typeof symTable[item.name] == 'object') {
                    try {
                        if (item.type === undefined) {
                            itemInfo.type = symTable[item.name].type;
                        }

                        itemInfo.arrayLength = symTable[item.name].arrayLength;
                        itemInfo.arrayDataType = symTable[item.name].arrayDataType;
                        itemInfo.dataType = symTable[item.name].dataType;
                        itemInfo.itemSize = symTable[item.name].itemSize;

                        if (itemInfo.size === undefined) {
                            itemInfo.size = symTable[item.name].size;
                        }

                        itemInfo.bitOffset = symTable[item.name].bitOffset;
                        itemInfo.offs = item.offs;

                        if (itemInfo.type === 'STRING' || itemInfo.arrayDataType === 'STRING') {
                            itemInfo.stringLength = symTable[item.name].stringLength;
                            itemInfo.format = itemInfo.stringLength; //compatibility
                        } else if (typeof item.format === 'string') {
                            itemInfo.format = item.format;
                        } else if (typeof item.decPlaces === 'number') {
                            itemInfo.format = item.decPlaces;
                        } else if (typeof item.dp === 'number') {
                            itemInfo.format = item.dp;
                        }

                        if (itemInfo.symbolNameArrIdx !== undefined && itemInfo.type === 'ARRAY') {
                            itemInfo.type = symTable[item.name].arrayDataType;
                            itemInfo.size = symTable[item.name].itemSize;
                        }

                    } catch (e) {
                        log('TAME library error: A problem occured while reading a data type from the symbol table!');
                        log(e);
                        log(item);
                    }
                } else {
                    if (typeof item.type != 'string') {
                        log('TAME library error: Neither an entry for this symbol in the symbol table nor the type defined by user!');
                        log(item);
                    }
                }

            }

            //Override type if defined by user
            if (typeof item.type == 'string') {
                //Type is defined by user
                arr = item.type.split('.');
                itemInfo.type = arr[0];
                if (arr.length > 2) {
                    //Join the formatting string if there were points in it.
                    arr[1] = arr.slice(1).join('.');
                }

                if (itemInfo.type === 'STRING') {
                    arr[1] = parseInt(arr[1], 10);
                    if (isValidStringLen(arr[1])) {
                        itemInfo.format = arr[1];
                    } else {
                        itemInfo.format = plcTypeLen.STRING;
                        log('TAME library warning: Length of string variable not defined: ' + item.name);
                        log('TAME library warning: A length of 80 characters (TwinCAT default) will be used.');
                    }
                    itemInfo.stringLength = itemInfo.format;
                    itemInfo.size = itemInfo.format++; //Termination
                } else if (itemInfo.type === 'ARRAY') {
                    /*
                    Maybe in a future version.
                    
                    itemInfo.arrayLength = dataTypeTable[dataType].subItems[typeArray[i]].arrayLength;
                    itemInfo.arrayDataType = dataTypeTable[dataType].subItems[typeArray[i]].arrayDataType;
                    itemInfo.dataType = dataTypeTable[dataType].subItems[typeArray[i]].dataType;
                    itemInfo.itemSize = dataTypeTable[dataType].subItems[typeArray[i]].itemSize;
                    */
                } else if (itemInfo.type === 'USER') {
                    /*
                    Maybe in a future version.
                    */
                } else {
                    itemInfo.format = arr[1];
                    itemInfo.size = plcTypeLen[itemInfo.type];
                }

                if (typeof item.format === 'string') {
                    itemInfo.format = item.format;
                } else if (typeof item.decPlaces === 'number') {
                    itemInfo.format = item.decPlaces;
                } else if (typeof item.dp === 'number') {
                    itemInfo.format = item.dp;
                }
                /*
                log('item');
                log(item);
                log('itemInfo');
                log(itemInfo);
                */
            }

            if (typeof itemInfo.type != 'string') {
                log('TAME library error: Could not get the type of the item!');
                log(item);
            }

            /*
            log('itemInfo');
            log(itemInfo);
            */

            return itemInfo;

        }


        /**
         * This function creates a XMLHttpRequest object.
         * 
         * @return {Object} xmlHttpReq  A XMLHttpRequest.
         */
        function createXMLHttpReq() {
            var xmlHttpReq;

            if (window.XMLHttpRequest) {
                //Create the XMLHttpRequest object.
                //Mozilla, Opera, Safari and Internet Explorer (> v7)
                xmlHttpReq = new window.XMLHttpRequest();
            } else {
                //Internet Explorer 6 and older
                try {
                    xmlHttpReq = new window.ActiveXObject('Msxml2.XMLHTTP');
                } catch (e) {
                    try {
                        xmlHttpReq = new window.ActiveXObject('Microsoft.XMLHTTP');
                    } catch (ex) {
                        xmlHttpReq = null;
                        log('TAME library error: Failed Creating XMLHttpRequest-Object!');
                    }
                }
            }
            return xmlHttpReq;
        }


        /**
         * Create the objects for SOAP and XMLHttpRequest and send the request.
         * 
         * @param {Object} adsReq   The object containing the arguments of the ADS request.
         */
        function createRequest(adsReq) {

            if (adsReq.reqDescr === undefined) {
                adsReq.reqDescr = {};
            } else if (adsReq.reqDescr.debug) {
                log(adsReq);
            }

            adsReq.send = function () {

                var soapReq, async;

                //Cancel the request, if the last on with the same ID is not finished.
                if (typeof this.reqDescr.id === 'number' && currReq[this.reqDescr.id] > 0) {
                    log('TAME library warning: Request dropped (last request with ID ' + adsReq.reqDescr.id + ' not finished!)');
                    currReq[this.reqDescr.id]++;
                    if (currReq[this.reqDescr.id] <= instance.maxDropReq) {
                        return;
                    }
                    //Automatic acknowleding after a count of 'maxDropReq' to
                    //prevent stucking.
                    currReq[this.reqDescr.id] = 0;
                }

                //Check if this should be a synchronous or a asynchronous XMLHttpRequest
                //adsReq.sync is used internal and it's most important, then comes reqDescr.sync and
                //at last the global parameter 
                if (adsReq.sync === true) {
                    async = false;
                } else if (this.reqDescr.sync === true) {
                    async = false;
                } else if (this.reqDescr.sync === false) {
                    async = true;
                } else if (service.syncXmlHttp === true) {
                    async = false;
                } else {
                    async = true;
                }

                //Create the XMLHttpRequest object.
                this.xmlHttpReq = createXMLHttpReq();

                //Generate the SOAP request.
                soapReq = '<?xml version=\'1.0\' encoding=\'utf-8\'?>';
                soapReq += '<soap:Envelope xmlns:xsi=\'http://www.w3.org/2001/XMLSchema-instance\' ';
                soapReq += 'xmlns:xsd=\'http://www.w3.org/2001/XMLSchema\' ';
                soapReq += 'xmlns:soap=\'http://schemas.xmlsoap.org/soap/envelope/\'>';
                soapReq += '<soap:Body><q1:';
                soapReq += this.method;
                soapReq += ' xmlns:q1=\'http://beckhoff.org/message/\'><netId xsi:type=\'xsd:string\'>';
                soapReq += service.amsNetId;
                soapReq += '</netId><nPort xsi:type=\'xsd:int\'>';
                soapReq += service.amsPort;
                soapReq += '</nPort>';

                if (this.indexGroup !== undefined) {
                    soapReq += '<indexGroup xsi:type=\'xsd:unsignedInt\'>';
                    soapReq += this.indexGroup;
                    soapReq += '</indexGroup>';
                }
                if (this.indexOffset !== undefined) {
                    soapReq += '<indexOffset xsi:type=\'xsd:unsignedInt\'>';
                    soapReq += this.indexOffset;
                    soapReq += '</indexOffset>';
                }
                if ((this.method === 'Read' || this.method === 'ReadWrite') && this.reqDescr.readLength > 0) {
                    soapReq += '<cbRdLen xsi:type=\'xsd:int\'>';
                    soapReq += this.reqDescr.readLength;
                    soapReq += '</cbRdLen>';
                }
                if (this.pData && this.pData.length > 0) {
                    soapReq += '<pData xsi:type=\'xsd:base64Binary\'>';
                    soapReq += this.pData;
                    soapReq += '</pData>';
                }
                if (this.pwrData && this.pwrData.length > 0) {
                    soapReq += '<pwrData xsi:type=\'xsd:base64Binary\'>';
                    soapReq += this.pwrData;
                    soapReq += '</pwrData>';
                }
                soapReq += '</q1:';
                soapReq += this.method;
                soapReq += '></soap:Body></soap:Envelope>';

                //Send the AJAX request.
                if (typeof this.xmlHttpReq === 'object') {

                    this.xmlHttpReq.open('POST', service.serviceUrl, async, service.serviceUser, service.servicePassword);

                    this.xmlHttpReq.setRequestHeader('SOAPAction', 'http://beckhoff.org/action/TcAdsSync.' + this.method);
                    this.xmlHttpReq.setRequestHeader('Content-Type', 'text/xml; charset=utf-8');

                    if (async === true) {
                        //asynchronous request

                        //Test with timeout
                        //experimental, seems like it doesn't work with all browsers (05/2017)
                        this.xmlHttpReq.timeout = instance.xmlHttpReqTimeout;
                        this.xmlHttpReq.ontimeout = function (e) {
                            log('TAME library error: XMLHttpRequest timed out. Timeout ' + instance.xmlHttpReqTimeout + ' milliseconds.');
                            log(e);
                            if (typeof adsReq.reqDescr.ot === 'function') {
                                //on timeout function
                                adsReq.reqDescr.ot();
                            }
                        };

                        this.xmlHttpReq.onreadystatechange = function () {
                            if (adsReq.xmlHttpReq.readyState === 4) {
                                if (adsReq.xmlHttpReq.status === 200) {
                                    //request OK
                                    instance.parseResponse(adsReq);
                                } else {
                                    //request failed
                                    log('TAME library error: XMLHttpRequest returns an error. Status code : ' + adsReq.xmlHttpReq.status);
                                    if (typeof adsReq.reqDescr.oe === 'function') {
                                        //on error function
                                        adsReq.reqDescr.oe();
                                    }
                                }
                            }
                        };
                        this.xmlHttpReq.send(soapReq);
                    } else {
                        //synchronous request
                        this.xmlHttpReq.send(soapReq);
                        instance.parseResponse(adsReq);
                    }

                    //Request with index 'id' sent.
                    if (typeof this.reqDescr.id === 'number') {
                        currReq[this.reqDescr.id] = 1;
                    }
                }
            };
            return adsReq;
        }


        /**
         * Function for checking the input values when writing numeric PLC variables.
         * 
         * @param {Object} item
         * @param {String} type
         * @param {Number} min
         * @param {Number} max
         */
        function checkValue(item, type, min, max) {
            var val;

            //Test if value is valid.
            if (typeof item.val === 'string') {
                if (type === 'REAL' || type === 'LREAL') {
                    val = parseFloat(item.val);
                } else {
                    val = parseInt(item.val, 10);
                }
            } else if (typeof item.val === 'number') {
                val = item.val;
            } else {
                log('TAME library error: Wrong variable type for a numeric variable in write request!');
                log('TAME library error: Variable type should be number or string, but is ' + typeof item.val);
                log(item);
                val = 0;
            }

            if (isNaN(val)) {
                val = 0;
                log('TAME library error: Value of a numeric variable in write request is not a number.');
                log(item);
            }

            //Check bounds
            if (instance.useCheckBounds === true) {
                if (type === 'LREAL') {
                    if (!isFinite(val)) {
                        log('TAME library warning: Limit for LREAL value exceeded!');
                        log('Upper limit: ' + Number.MAX_VALUE);
                        log('Lower limit: ' + Number.MIN_VALUE);
                        log('value: ' + val);
                        log(item);
                    }
                } else if (type === 'REAL') {
                    if (val > 0) {
                        if (val < 1.175495e-38) {
                            log('TAME library warning: Lower limit for positive REAL value exceeded!');
                            log('limit: 1.175495e-38');
                            log('value: ' + val);
                            log(item);
                            val = 1.175495e-38;
                        } else if (val > 3.402823e+38) {
                            log('TAME library warning: Upper limit for positive REAL value exceeded!');
                            log('limit: 3.402823e+38');
                            log('value: ' + val);
                            log(item);
                            val = 3.402823e+38;
                        }
                    } else if (val < 0) {
                        if (val > -1.175495e-38) {
                            log('TAME library warning: Upper limit for negative REAL value exceeded!');
                            log('limit: -1.175495e-38');
                            log('value: ' + val);
                            log(item);
                            val = -1.175495e-38;
                        } else if (val < -3.402823e+38) {
                            log('TAME library warning: Lower limit for negative REAL value exceeded!');
                            log('limit: -3.402823e+38');
                            log('value: ' + val);
                            log(item);
                            val = -3.402823e+38;
                        }
                    }
                } else {
                    if (val < min) {
                        log('TAME library warning: Lower limit for numeric value exceeded!');
                        log('type: ' + type);
                        log('limit: ' + min);
                        log('value: ' + val);
                        log(item);
                        val = min;
                    }
                    else if (val > max) {
                        log('TAME library warning: Upper limit for numeric value exceeded!');
                        log('type: ' + type);
                        log('limit: ' + max);
                        log('value: ' + val);
                        log(item);
                        val = max;
                    }
                }
            }

            return val;
        }


        /**
         * Get type and format and return it in an array. Create an
         * item.type entry if it doesn't exist. 
         * 
         * @param {Object} item     An item of a variable list.
         * @return {Array} arr      An array with type and format. 
         */
        function getTypeAndFormat(item) {
            var arr = [], typeArray, dataType, i;

            if (typeof item.type === 'string') {
                //Type is defined
                arr = item.type.split('.');
                if (arr.length > 2) {
                    //Join the formatting string if there were points in it.
                    arr[1] = arr.slice(1).join('.');
                }
            } else {
                log('TAME library error: Could not get the type of the item (function getTypeAndFormat())!');
                log(item);
            }
            return arr;
        }

        /**
         * Create a structure definition based on the information in the data table.
         * 
         * @param {String}  structname  The name of the structure in the data table.
         * @return {Object} struct      An object containing the items of the structure. 
         */
        function createStructDef(structname) {
            var struct = {}, subitem, subitems;

            subitems = dataTypeTable[structname].subItems;

            for (subitem in subitems) {
                if (subitems[subitem].type === "USER") {
                    //Creating a nested structue definition works, but parsing doesn't
                    log('TAME library error: Automatic creating of nested structures is not supported (yet)!');
                    struct[subitem] = createStructDef(subitems[subitem].dataType);
                } else {
                    if (subitems.hasOwnProperty(subitem)) {
                        struct[subitem] = subitems[subitem].fullType;
                    }
                }
            }
            return struct;
        }



        //======================================================================================
        //                                  Encoder Functions
        //======================================================================================

        /**
         * Conversion of ASCII(0-9, a-f, A-F) charcodes to numbers 0-15
         * 
         * @param {Number} charcode
         */
        function charcodeToDual(charcode) {
            if ((charcode >= 0x61) && (charcode <= 0x66)) {
                return (charcode - 0x57);  //a-f
            }
            if ((charcode >= 0x41) && (charcode <= 0x46)) {
                return (charcode - 0x37);  //A-F
            }
            if ((charcode >= 0x30) && (charcode <= 0x39)) {
                return (charcode - 0x30);  //0-9
            }
            return 0;
        }

        /**
         * Convert a number into an array of bytes.
         * 
         * @param {Number} value
         * @param {Number} varlen
         */
        function numToByteArr(value, varlen) {
            var bytes = [],
                hex = value.toString(16),
                i;

            while (hex.length < varlen * 2) {
                hex = '0' + hex;
            }

            for (i = 0; i < varlen; i++) {
                bytes[(varlen - 1) - i] =
                    ((charcodeToDual(hex.charCodeAt(i * 2)) * 16) +
                        charcodeToDual(hex.charCodeAt((i * 2) + 1)));
            }
            return bytes;
        }

        /**
         * Convert a JavaScript floating point number to a PLC REAL value.
         * 
         * @param {Number} num
         */
        function floatToReal(num) {

            var mant = 0,
                real = 0,
                bas, abs, tmp, exp, i;

            abs = Math.abs(num);

            if (num !== 0) {
                //Find exponent and base.
                for (i = 128; i > -127; i--) {
                    tmp = abs / Math.pow(2, i);
                    if (tmp >= 2) {
                        break;
                    }
                    exp = i;
                    bas = tmp;
                }
                exp += 127;
                bas = bas.toString(2);
                //Create the mantissa.
                for (i = 2; i < 25; i++) {
                    mant <<= 1;
                    if (bas.charAt(i) === '1') {
                        mant += 1;
                    }
                }
                if (bas.charAt(25) === '1') {
                    mant += 1;
                }
                //Create the REAL value.
                real = exp; //exponent
                real <<= 23;
                real += mant; //mantissa
                if (num < 0) {
                    //Create negative sign.
                    real += 2147483648;
                }
            }
            return real;
        }

        /**
          * Convert a JavaScript floating point number to a PLC LREAL value.
          * Cause it's a 64 bit value, we have to split it in two 32 bit integer.
          * 
          * @param {Number} num
          */
        function floatToLreal(num) {
            var mant = 0,
                mant2 = 0,
                lreal = {
                    part1: 0,
                    part2: 0
                },
                abs, tmp, exp, firstbit, bas, i;

            abs = Math.abs(num);

            if (num !== 0) {
                //Find exponent and base.
                for (i = 1024; i >= -1023; i--) {
                    tmp = abs / Math.pow(2, i);
                    if (tmp >= 2) {
                        break;
                    }
                    exp = i;
                    bas = tmp;
                }
                exp += 1023;
                bas = bas.toString(2);
                //Create the mantissa.
                for (i = 2; i < 22; i++) {
                    mant <<= 1;
                    if (bas.charAt(i) === '1') {
                        mant += 1;
                    }
                }
                if (bas.charAt(i) === '1') {
                    firstbit = true;
                }
                i++;
                for (i; i < 54; i++) {
                    mant2 <<= 1;
                    if (bas.charAt(i) === '1') {
                        mant2 += 1;
                    }
                }
                //Create the LREAL value.
                lreal.part1 = exp; //exponent
                lreal.part1 <<= 20;
                lreal.part1 += mant; //mantissa
                if (num < 0) {
                    //Create negative sign.
                    lreal.part1 += 2147483648;
                }
                lreal.part2 = mant2;
                if (firstbit === true) {
                    lreal.part2 += 2147483648;
                }
            }
            return lreal;
        }

        /**
         * Convert a value to value in milliseconds, depending
         * on the format string.
         * 
         * @param {Number} time
         * @param {String} format
         */
        function toMillisec(time, format) {
            var tmp;
            switch (format) {
                case '#d':
                case '#dd':
                    tmp = time * 86400000;//days
                    break;
                case '#h':
                case '#hh':
                    tmp = time * 3600000; //hours
                    break;
                case '#m':
                case '#mm':
                    tmp = time * 60000;   //minutes
                    break;
                case '#s':
                case '#ss':
                    tmp = time * 1000;    //seconds
                    break;
                case '#ms':
                case '#msmsms':           //milliseconds
                    tmp = time;
                    break;
                default:
                    tmp = time;
                    break;
            }
            return tmp;
        }

        /**
         * Convert a TOD string to a value of milliseconds.
         * 
         * @param {Number} time
         * @param {String} format
         */
        function stringToTime(timestring, format) {
            var arrFormat = format.split('#'),
                arrlen = arrFormat.length,
                regex = /:|\.|-|_/,
                time = 0,
                cnt = 0,
                tmp, i, arrValues, splitterOk;

            //Check if a valid splitter is given
            for (i = 1; i < arrlen; i++) {
                if (regex.test(arrFormat[i]) === true) {
                    splitterOk = true;
                }
            }

            if (splitterOk !== true) {
                log('TAME library error: No separator ( : . - _ ) for TOD string found!');
                log('String: ' + timestring);
                log('Format: ' + format);
                //Although we could try to split the timestring in case of a 
                //wrong formatting string, we don't do it.
                return 0;
            }

            arrValues = timestring.split(regex);

            for (i = 1; i < arrlen; i++) {

                switch (arrFormat[i]) {
                    case 'h':
                    case 'hh':
                        tmp = parseInt(arrValues[cnt], 10) * 3600000;
                        cnt++;
                        break;
                    case 'm':
                    case 'mm':
                        tmp = parseInt(arrValues[cnt], 10) * 60000;
                        cnt++;
                        break;
                    case 's':
                    case 'ss':
                        tmp = parseInt(arrValues[cnt], 10) * 1000;
                        cnt++;
                        break;
                    case 'ms':
                    case 'msmsms':
                        tmp = parseInt(arrValues[cnt], 10);
                        cnt++;
                        break;
                    default:
                        tmp = 0;
                }
                time += tmp;
            }
            return time;
        }

        /**
         * Base64 encoder
         * 
         * @param {Array} data
         */
        function encodeBase64(data) {
            var $ = b64Enc,
                i = 0,
                out = '',
                c1, c2, c3;

            while (i < data.length) {
                c1 = data[i++];
                c2 = data[i++];
                c3 = data[i++];
                out = out +
                    $[c1 >> 2] +
                    $[((c1 & 3) << 4) | (c2 >> 4)] +
                    (isNaN(c2) ? '=' : $[(((c2 & 15) << 2) | (c3 >> 6))]) +
                    ((isNaN(c2) || isNaN(c3)) ? '=' : $[c3 & 63]);
            }
            return out;
        }

        /**
         * Function for converting the data values to a byte array.
         * 
         * @param {Object} item     An item of the item list of a request descriptor.
         * @param {String} type     Contains the data type
         * @param {String} format   The formatting string.
         * @param {Number} len      Data length.
         * @return {Array} bytes    An array containing the data as byte values.
         */
        function dataToByteArray(item, type, format, len) {

            var bytes = [],
                val, strlen, sl, i;

            //If no value is passed, set value to zero and log an error message.
            if (item.val === undefined) {
                switch (type) {
                    case 'STRING':
                        item.val = '';
                        break;
                    case 'DATE':
                    case 'DT':
                    case 'TOD':
                    case 'TIME_OF_DAY':
                    case 'DATE_AND_TIME':
                        item.val = new Date();
                        break;
                    default:
                        item.val = 0;
                        break;
                }
                log('TAME library warning: Value of a variable in write request is not defined!');
                log(item);
            }

            //Depending on the data type, convert the values to a byte array.
            switch (type) {
                case 'BOOL':
                    if (item.val) {
                        bytes[0] = 1;
                    } else {
                        bytes[0] = 0;
                    }
                    break;
                case 'BYTE':
                case 'USINT':
                    val = checkValue(item, type, 0, 255);
                    bytes = numToByteArr(val, len);
                    break;
                case 'SINT':
                    val = checkValue(item, type, -128, 127);
                    if (val < 0) {
                        val = val + 256;
                    }
                    bytes = numToByteArr(val, len);
                    break;
                case 'WORD':
                case 'UINT':
                    val = checkValue(item, type, 0, 65535);
                    bytes = numToByteArr(val, len);
                    break;
                case 'INT':
                case 'INT16':
                    val = checkValue(item, type, -32768, 32767);
                    if (val < 0) {
                        val = val + 65536;
                    }
                    bytes = numToByteArr(val, len);
                    break;
                case 'INT1DP':
                    item.val = Math.round(item.val * 10);
                    val = checkValue(item, type, -32768, 32767);
                    if (val < 0) {
                        val = val + 65536;
                    }
                    bytes = numToByteArr(val, len);
                    break;
                case 'INT2DP':
                    item.val = Math.round(item.val * 100);
                    val = checkValue(item, type, -32768, 32767);
                    if (val < 0) {
                        val = val + 65536;
                    }
                    bytes = numToByteArr(val, len);
                    break;
                case 'DWORD':
                case 'UDINT':
                    val = checkValue(item, type, 0, 4294967295);
                    bytes = numToByteArr(val, len);
                    break;
                case 'DINT':
                    val = checkValue(item, type, -2147483648, 2147483647);
                    if (val < 0) {
                        val = val + 4294967296;
                    }
                    bytes = numToByteArr(val, len);
                    break;
                case 'REAL':
                    val = checkValue(item, type);
                    val = floatToReal(val);
                    bytes = numToByteArr(val, len);
                    break;
                case 'LREAL':
                    val = checkValue(item, type);
                    val = floatToLreal(val);
                    //Length set to 4, cause type length is 8 and there are 2 parts
                    bytes = numToByteArr(val.part2, 4);
                    bytes = bytes.concat(numToByteArr(val.part1, 4));
                    break;
                case 'DATE':
                    if (typeof item.val === 'object') {
                        //Delete the time portion.
                        item.val.setHours(0);
                        item.val.setMinutes(0);
                        item.val.setSeconds(0);
                        //Convert the date object in seconds since 1.1.1970 and
                        //set the time zone to UTC.
                        val = item.val.getTime() / 1000 - item.val.getTimezoneOffset() * 60;
                    } else {
                        log('TAME library error: Value of a DATE variable in write request is not a date object!');
                        log(item);
                    }
                    bytes = numToByteArr(val, len);
                    break;
                case 'DT':
                case 'DATE_AND_TIME':
                    if (typeof item.val === 'object') {
                        //Convert the date object in seconds since 1.1.1970 and
                        //set the time zone to UTC.
                        val = item.val.getTime() / 1000 - item.val.getTimezoneOffset() * 60;
                    } else {
                        log('TAME library error: Value of a DT variable in write request is not a date object!');
                        log(item);
                    }
                    bytes = numToByteArr(val, len);
                    break;
                case 'TOD':
                case 'TIME_OF_DAY':
                    if (typeof item.val === 'object') {
                        //Delete the date portion.
                        item.val.setYear(1970);
                        item.val.setMonth(0);
                        item.val.setDate(1);
                        //Convert the date object in seconds since 1.1.1970 and
                        //set the time zone to UTC.
                        val = item.val.getTime() - item.val.getTimezoneOffset() * 60000;
                    } else if (typeof item.val === 'string') {
                        //If the time value is a string
                        if (format === '' || format === undefined) {
                            format = '#hh#:#mm';
                            log('TAME library warning: No format given for TOD string! Using default #hh#:#mm.');
                            log(item);
                        }
                        val = stringToTime(item.val, format);
                    } else {
                        log('TAME library error: TOD value in write request is wether a date object nor a string!');
                        log(item);
                    }
                    bytes = numToByteArr(val, len);
                    break;
                case 'STRING':
                    //If no length is given, set it to 80 characters (TwinCAT default).                 
                    strlen = (format === undefined) ? plcTypeLen.STRING : parseInt(format, 10);

                    if (isValidStringLen(strlen)) {
                        //If the given string length is valid and shorter then the string
                        //then use the given value to avoid an overflow, otherwise use
                        //the real string length.
                        sl = strlen < item.val.length ? strlen : item.val.length;
                        for (i = 0; i < sl; i++) {
                            bytes[i] = item.val.charCodeAt(i);
                        }
                        //Fill the string up to the given length, if necessary.
                        for (i; i < strlen; i++) {
                            bytes[i] = 0;
                        }
                        //Termination, the real string length in the PLC is
                        //the defined length + 1.
                        bytes[i] = 0;
                    }
                    break;
                case 'TIME':
                    val = parseInt(item.val, 10);
                    if (isNaN(val)) {
                        log('TAME library warning: Value of a TIME variable in write request is not defined!');
                        log(item);
                        val = 0;
                    }
                    val = toMillisec(val, format);
                    if (val < 0) {
                        val = 0;
                        log('TAME library warning: Lower limit for TIME variable in write request exceeded!)');
                        log('value: ' + item.val + format);
                        log(item);
                    } else if (val > 4294967295) {
                        val = 4294967295;
                        log('TAME library warning: Upper limit for TIME variable in write request exceeded!)');
                        log('value: ' + item.val + format);
                        log(item);
                    }
                    bytes = numToByteArr(val, len);
                    break;
                case 'EndStruct':
                    //Do nothing.
                    break;
                default:
                    log('TAME library error: Unknown data type in write request : ' + type);
                    break;
            }

            return bytes;

        }



        //======================================================================================
        //                                  Decoder Functions
        //======================================================================================

        /**
         * Convert a number to a hex string.
         * 
         * @param {Number} value
         */
        function numToHexString(value) {
            var ret = value.toString(16);
            if ((ret.length % 2) !== 0) {
                ret = '0' + ret;
            }
            return ret;
        }

        /**
         * Set a fixed length of an integer by adding leading 
         * zeros(i.e. change 2 to 02).
         * 
         * @param {Number} numb
         * @param {Number} places
         */
        function fixNumbLength(numb, places) {
            places = (isNaN(places)) ? 0 : places;
            var str = numb.toString(10);
            while (str.length < places) {
                str = '0' + str;
            }
            return str;
        }

        /**
         * Convert a date object to a formatted string.
         * 
         * @param {Date} time
         * @param {String} format
         */
        function dateToString(time, format) {

            var arr = format.split('#'),
                arrlen = arr.length,
                tstring = '',
                tmp, i;

            for (i = 1; i < arrlen; i++) {

                switch (arr[i]) {
                    //Date formatting.
                    case 'D':
                        tmp = time.getDate();
                        break;
                    case 'DD':
                        tmp = time.getDate();
                        tmp = fixNumbLength(tmp, 2);
                        break;
                    case 'WD':
                        tmp = time.getDay();
                        break;
                    case 'WKD':
                        tmp = instance.dateNames.weekdShort[time.getDay()];
                        break;
                    case 'WEEKDAY':
                        tmp = instance.dateNames.weekdLong[time.getDay()];
                        break;
                    case 'M':
                        tmp = time.getMonth() + 1;
                        break;
                    case 'MM':
                        tmp = time.getMonth() + 1;
                        tmp = fixNumbLength(tmp, 2);
                        break;
                    case 'MON':
                        tmp = instance.dateNames.monthsShort[time.getMonth()];
                        break;
                    case 'MONTH':
                        tmp = instance.dateNames.monthsLong[time.getMonth()];
                        break;
                    case 'YY':
                        tmp = time.getYear();
                        while (tmp > 100) {
                            tmp -= 100;
                        }
                        break;
                    case 'YYYY':
                        tmp = time.getFullYear();
                        break;

                    //Time formatting.
                    case 'h':
                        tmp = time.getHours();
                        break;
                    case 'hh':
                        tmp = time.getHours();
                        tmp = fixNumbLength(tmp, 2);
                        break;
                    case 'm':
                        tmp = time.getMinutes();
                        break;
                    case 'mm':
                        tmp = time.getMinutes();
                        tmp = fixNumbLength(tmp, 2);
                        break;
                    case 's':
                        tmp = time.getSeconds();
                        break;
                    case 'ss':
                        tmp = time.getSeconds();
                        tmp = fixNumbLength(tmp, 2);
                        break;
                    case 'ms':
                        tmp = time.getMilliseconds();
                        break;
                    case 'msmsms':
                        tmp = time.getMilliseconds();
                        tmp = fixNumbLength(tmp, 3);
                        break;
                    default:
                        tmp = arr[i];
                        break;
                }
                tstring = tstring + tmp;
            }
            return tstring;
        }

        /**
         * Convert a number with a value in milliseconds to a formatted string.
         * 
         * @param {Number} time
         * @param {String} format
         */
        function timeToString(time, format) {
            var arr = format.split('#'),
                arrlen = arr.length,
                tstring = '',
                tmp, i;

            for (i = 1; i < arrlen; i++) {

                switch (arr[i]) {
                    case 'd':
                        if (arrlen <= 2) {
                            tmp = time / 86400000;
                        } else {
                            tmp = Math.floor(time / 86400000);
                            time = time % 86400000;
                        }
                        break;
                    case 'dd':
                        if (arrlen <= 2) {
                            tmp = time / 86400000;
                        } else {
                            tmp = Math.floor(time / 86400000);
                            time = time % 86400000;
                        }
                        tmp = fixNumbLength(tmp, 2);
                        break;
                    case 'h':
                        if (arrlen <= 2) {
                            tmp = time / 3600000;
                        } else {
                            tmp = Math.floor(time / 3600000);
                            time = time % 3600000;
                        }
                        break;
                    case 'hh':
                        if (arrlen <= 2) {
                            tmp = time / 3600000;
                        } else {
                            tmp = Math.floor(time / 3600000);
                            time = time % 3600000;
                        }
                        tmp = fixNumbLength(tmp, 2);
                        break;
                    case 'm':
                        if (arrlen <= 2) {
                            tmp = time / 60000;
                        } else {
                            tmp = Math.floor(time / 60000);
                            time = time % 60000;
                        }
                        break;
                    case 'mm':
                        if (arrlen <= 2) {
                            tmp = time / 60000;
                        } else {
                            tmp = Math.floor(time / 60000);
                            time = time % 60000;
                        }
                        tmp = fixNumbLength(tmp, 2);
                        break;
                    case 's':
                        if (arrlen <= 2) {
                            tmp = time / 1000;
                        } else {
                            tmp = Math.floor(time / 1000);
                            time = time % 1000;
                        }
                        break;
                    case 'ss':
                        if (arrlen <= 2) {
                            tmp = time / 1000;
                        } else {
                            tmp = Math.floor(time / 1000);
                            time = time % 1000;
                        }
                        tmp = fixNumbLength(tmp, 2);
                        break;
                    case 'ms':
                        tmp = time;
                        break;
                    case 'msmsms':
                        tmp = time;
                        tmp = fixNumbLength(tmp, 3);
                        break;
                    default:
                        tmp = arr[i];
                        break;
                }
                tstring = tstring + tmp;
            }
            return tstring;
        }

        /**
         * Convert data string to USINT/BYTE.
         * 
         * @param {String} string
         */
        function parsePlcUsint(string) {
            var hexs = numToHexString(string.charCodeAt(0));
            return parseInt(hexs, 16);
        }

        /**
         * Convert data string to SINT.
         * 
         * @param {String} string
         */
        function parsePlcSint(string) {
            var dec = parsePlcUsint(string);
            if (dec > 127) {
                dec = dec - 256;
            }
            return dec;
        }

        /**
         * Convert data string to UINT/WORD.
         * 
         * @param {String} string
         */
        function parsePlcUint(string) {
            var hexs = numToHexString(string.charCodeAt(1));
            hexs += numToHexString(string.charCodeAt(0));
            return parseInt(hexs, 16);
        }

        /**
         * Convert data string to INT.
         * 
         * @param {String} string
         */
        function parsePlcInt(string) {
            var dec = parsePlcUint(string);
            if (dec > 32767) {
                dec = dec - 65536;
            }
            return dec;
        }

        /**
         * Convert data string to UDINT/DWORD.
         * 
         * @param {String} string
         */
        function parsePlcUdint(string) {
            var hexs = numToHexString(string.charCodeAt(3));
            hexs += numToHexString(string.charCodeAt(2));
            hexs += numToHexString(string.charCodeAt(1));
            hexs += numToHexString(string.charCodeAt(0));
            return parseInt(hexs, 16);
        }

        /**
         * Convert data string to DINT.
         * 
         * @param {String} string
         */
        function parsePlcDint(string) {
            var dec = parsePlcUdint(string);
            if (dec > 2147483647) {
                dec = dec - 4294967296;
            }
            return dec;
        }

        /**
         * Convert data string to a formatted time string
         * 
         * @param {String} string
         * @param {String} format
         */
        function parsePlcTime(string, format) {
            var time = parsePlcUdint(string);
            if (format === undefined) {
                return time;    //Unformatted: value in milliseconds.
            }
            return (timeToString(time, format));
        }

        /**
         * Convert data string to a formatted time of day string.
         * 
         * @param {String} string
         * @param {String} format
         */
        function parsePlcTod(string, format) {
            //Create a date object (time base in the PLC are milliseconds)
            var time = new Date(parsePlcUdint(string));

            //Time zone correction.
            time = new Date(time.getTime() + time.getTimezoneOffset() * 60000);

            if (format === undefined) {
                return time;
            }
            return (dateToString(time, format));
        }

        /**
         * Convert data string to a formatted date/time of day string.
         * 
         * @param {String} string
         * @param {String} format
         */
        function parsePlcDate(string, format) {
            //Converte to milliseconds an create a date object
            //(time base of DATE/DT variables in the PLC are seconds since 1.1.1970)
            var date = new Date(parsePlcUdint(string) * 1000);

            //Time zone correction.
            date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

            if (format === undefined) {
                return date;
            }
            return (dateToString(date, format));
        }

        /**
         * Convert data string of a REAL variable
         * to a JavaScript floating point number.
         * 
         * @param {String} string
         */
        function parsePlcReal(string) {
            var mant = 1,
                dual = 0.5,
                num = parsePlcUdint(string),
                sign, exp, i;

            //Return if value is zero. 
            if (num === 0) {
                return 0;
            }
            //Check the sign bit.
            sign = ((num >>> 31) === 1) ? '-' : '+';
            num <<= 1; //Delete the sign bit.
            //Calculate the exponent.
            exp = (num >>> 24) - 127;
            //Calculate the 23 bit mantissa: Shift bits to left and evaluate them.
            num <<= 8;
            for (i = 1; i <= 23; i++) {
                mant += num < 0 ? dual : 0; //Add if left (sign bit) bit is true.
                num <<= 1;
                dual /= 2;
            }
            return parseFloat(sign + (mant * Math.pow(2, exp)));
        }

        /**
         * Convert data string of a LREAL variable
         * to a JavaScript floating point number.
         * 
         * @param {String} string
         */
        function parsePlcLreal(string) {
            var num = parsePlcUdint(string.substring(4, 8)),
                num2 = parsePlcUdint(string.substring(0, 4)),
                i = 12,
                mant = 1,
                dual = 0.5,
                sign, exp;

            //Return if value is zero. 
            if (num === 0 && num2 === 0) {
                return 0;
            }
            //Check the sign bit.
            sign = ((num >>> 31) === 1) ? '-' : '+';
            num <<= 1; //Delete the sign bit.
            //Calculate the exponent.
            exp = (num >>> 21) - 1023;
            //Calculate the mantissa. Shift bits to left and evaluate them.
            //Part 1.
            num <<= 11;
            while (i < 32) {
                mant += num < 0 ? dual : 0; //Add if left (sign bit) bit is true.
                num <<= 1;
                dual /= 2;
                i++;
            }
            //Part 2.
            if ((num2 >>> 31) === 1) {
                mant += dual;
                num2 <<= 1;
                dual /= 2;
            }
            while (i < 64) {
                mant += num2 < 0 ? dual : 0; //Add if left (sign bit) bit is true.
                num2 <<= 1;
                dual /= 2;
                i++;
            }
            return parseFloat(sign + (mant * Math.pow(2, exp)));
        }


        /**
         * Convert data string to string by simply cutting of superfluous characters.
         * 
         * @param {String} string
         */
        function parsePlcString(string) {
            /*
            var len = string.length;
            for (var i = 0; i < len; i++) {
                if (string.charCodeAt(i) === 0) {
                    break;
                }
            }
            return string.substr(0, i);
            */
            return string.split(String.fromCharCode(0))[0];
        }


        /**
         * Base64 decoder
         * 
         * @param {String} data
         */
        function decodeBase64(data) {
            var $ = b64Dec,
                i = 0,
                output = '',
                c1, c2, c3,
                e1, e2, e3, e4;

            //Cut all characters but A-Z, a-z, 0-9, +, /, or =
            data = data.replace(/[^A-Za-z0-9\+\/\=]/g, '');

            do {
                e1 = $[data.charAt(i++)];
                e2 = $[data.charAt(i++)];
                e3 = $[data.charAt(i++)];
                e4 = $[data.charAt(i++)];

                c1 = (e1 << 2) | (e2 >> 4);
                c2 = ((e2 & 15) << 4) | (e3 >> 2);
                c3 = ((e3 & 3) << 6) | e4;

                output += String.fromCharCode(c1);
                if (e3 !== 64) {
                    output += String.fromCharCode(c2);
                }
                if (e4 !== 64) {
                    output += String.fromCharCode(c3);
                }
            }
            while (i < data.length);

            return output;
        }

        /**
         * Convert B64-substrings to data.
         * 
         * @param {String} dataString
         * @param {String} type
         * @param {String, Number} format
         * @return {Mixed} data
         * 
         */
        function subStringToData(dataString, type, format) {
            var data;

            switch (type) {
                case 'BOOL':
                    //Does this work????? Seems like.
                    data = (dataString.charCodeAt(0) != '0');
                    break;
                case 'BYTE':
                case 'USINT':
                    data = parsePlcUsint(dataString);
                    break;
                case 'SINT':
                    data = parsePlcSint(dataString);
                    break;
                case 'WORD':
                case 'UINT':
                    data = parsePlcUint(dataString);
                    break;
                case 'INT':
                case 'INT16':
                    data = parsePlcInt(dataString);
                    break;
                case 'INT1DP':
                    data = ((parsePlcInt(dataString)) / 10).toFixed(1);
                    break;
                case 'INT2DP':
                    data = ((parsePlcInt(dataString)) / 100).toFixed(2);
                    break;
                case 'DWORD':
                case 'UDINT':
                    data = parsePlcUdint(dataString);
                    break;
                case 'DINT':
                    data = parsePlcDint(dataString);
                    break;
                case 'REAL':
                    data = parsePlcReal(dataString);
                    if (format !== undefined) {
                        data = data.toFixed(parseInt(format, 10));
                    }
                    break;
                case 'LREAL':
                    data = parsePlcLreal(dataString);
                    if (format !== undefined) {
                        data = data.toFixed(parseInt(format, 10));
                    }
                    break;
                case 'STRING':
                    data = parsePlcString(dataString);
                    break;
                case 'TOD':
                case 'TIME_OF_DAY':
                    data = parsePlcTod(dataString, format);
                    break;
                case 'TIME':
                    data = parsePlcTime(dataString, format);
                    break;
                case 'DT':
                case 'DATE':
                case 'DATE_AND_TIME':
                    data = parsePlcDate(dataString, format);
                    break;
                case 'EndStruct':
                    //Just do nothing.
                    break;
                default:
                    log('TAME library error: Unknown data type at parsing read request: ' + type);
                    break;
            }

            return data;
        }

        /**
         * Decode the response string of a Read Request and store the data.
         * 
         * @param {Object} adsReq   ADS Reqest Object
         */
        function parseReadReq(adsReq) {

            var response,
                itemList = adsReq.reqDescr.items,
                arrType = [],
                strAddr = 0,
                item, dataString, dataSubString, data, strlen, len, plen, mod, type, format, idx, listlen, startaddr;


            try {

                response = adsReq.xmlHttpReq.responseXML.documentElement;
                dataString = decodeBase64(response.getElementsByTagName('ppData')[0].firstChild.data);

                //Run through the elements in the item list.
                for (idx = 0, listlen = itemList.length; idx < listlen; idx++) {

                    item = itemList[idx];

                    //Get type and formatting string.
                    arrType = getTypeAndFormat(item);
                    type = arrType[0];
                    format = arrType[1];

                    //Get the length of the data types.
                    len = plcTypeLen[type];

                    switch (type) {
                        case 'STRING':
                            if (format !== undefined) {
                                strlen = parseInt(format, 10);
                            }
                            len = (isValidStringLen(strlen) ? strlen : len) + 1;
                            break;
                        case 'EndStruct':
                            //Set the length of the padding bytes at the end of the structure
                            //"EndStruct" is only used with "readArrayOfStructures/writeArrayOfStructures".
                            len = item.val;
                            break;
                    }

                    //Set the length for calculating padding bytes
                    plen = len < alignment ? len : alignment;

                    //Calculate the place of the element in the data string
                    if (adsReq.reqDescr.seq !== true) {
                        //If variable addresses are used.
                        startaddr = getIndexOffset(adsReq.reqDescr);
                        strAddr = item.addr - startaddr;
                    } else if (adsReq.reqDescr.calcAlignment === true && plen > 1 && type !== 'EndStruct' && type !== 'STRING' && strAddr > 0) {
                        //Compute the address for the alignment in case of a structure.
                        mod = strAddr % plen;
                        if (mod > 0) {
                            strAddr += plen - mod;
                        }
                    }

                    //Slice the string and decode the data
                    dataSubString = dataString.substr(strAddr, len);
                    data = subStringToData(dataSubString, type, format);

                    //Parse the name of the JavaScript variable and write the data to it
                    if (type !== 'EndStruct') {
                        parseVarName(item.jvar, data, adsReq.reqDescr.dataObj, item.prefix, item.suffix);
                    }

                    //Set the next address
                    if (adsReq.reqDescr.seq === true) {
                        strAddr += len;
                    }
                }
            } catch (e) {
                log('TAME library error: Parsing of Read Request failed:' + e);
                log(item);
                return;
            }
        }

        /**
         * Decode the response string of a SumReadRequest and store the data.
         * 
         * @param {Object} adsReq   ADS Request Object
         */
        function parseSumReadReq(adsReq) {

            var response,
                itemList = adsReq.reqDescr.items,
                arrType = [],
                strAddr = 0,
                subStrAddr = 0,
                dataObj = window,
                vlenMax = 0,
                item, dataString, dataSubString, data, len, type, format, idx, listlen, errorCode, jvar, i,
                arrayLength, itemSize, itemInfo;


            /**
             * Slice a piece out of the substring, convert the data and write it
             * to the JavaScript variable.  
             */
            function parseSubStringSlice() {

                var strlen, subStrSlice;

                if (type === 'STRING') {
                    if (format !== undefined) {
                        strlen = parseInt(format, 10);
                    } else if (typeof itemInfo.stringLength === 'number') {
                        strlen = itemInfo.stringLength;
                    }
                    len = (isValidStringLen(strlen) ? strlen : len) + 1;
                }

                //Take a piece of the data sub string
                subStrSlice = dataSubString.substr(subStrAddr, len);
                //Convert the data
                data = subStringToData(subStrSlice, type, format);
                //Parse the name of the JavaScript variable and write the data to it
                parseVarName(jvar, data, dataObj, item.prefix, item.suffix);

                subStrAddr += len;
            }

            /**
             * Parse the stucture definition and compute the data of
             * the substring.
             */
            function parseStructure() {

                var j, defArr, lenArrElem, lastDefArr, mod, elem;

                /**
                 * Function for adjusting the address of the data in the string
                 * if an alignment is used. 
                 */
                function checkAlignment() {

                    var vlen, mod;

                    if (alignment > 1 && type !== 'STRING' && type !== 'EndStruct') {
                        //Set the length for calculating padding bytes
                        vlen = len < alignment ? len : alignment;

                        //Compute the address for the alignment.
                        if (vlen > 1 && subStrAddr > 0) {
                            mod = subStrAddr % vlen;
                            if (mod > 0) {
                                subStrAddr += vlen - mod;
                            }
                        }

                        //Store the maximum length of the PLC variables
                        //for inserting padding bytes at the end of the structure.
                        if (vlen > vlenMax) {
                            vlenMax = vlen;
                        }
                    }
                }

                //Check structure definition
                if (typeof item.def === 'string') {
                    item.def = parseVarName(item.def);
                } else if (instance.dataTypeTableReady === true && item.def === undefined) {
                    item.def = createStructDef(itemInfo.dataType);
                } else if (typeof item.def !== 'object') {
                    log('TAME library error: No structure defininition found (parseSumReadReq())!');
                    log(item);
                }

                for (elem in item.def) {

                    if (item.def.hasOwnProperty(elem)) {

                        defArr = item.def[elem].split('.');
                        if (defArr[0] === 'ARRAY') {
                            lenArrElem = parseInt(defArr[1], 10);
                            lastDefArr = defArr.length - 1;
                            for (j = 0; j < lenArrElem; j++) {
                                type = defArr[2];
                                if (defArr[lastDefArr] === 'SP') {
                                    jvar = elem + j;
                                    if (lastDefArr >= 4) {
                                        format = defArr.slice(3, -1).join('.');
                                    }
                                } else {
                                    jvar = elem + '.' + j;
                                    if (lastDefArr >= 3) {
                                        format = defArr.slice(3).join('.');
                                    }
                                }
                                //Add index in case of an array of struct
                                if (i !== null) {
                                    jvar = i + '.' + jvar;
                                }

                                len = plcTypeLen[type];
                                checkAlignment();
                                parseSubStringSlice();
                            }
                        } else {
                            //Check if we are in an array of struct
                            if (i !== null) {
                                jvar = i + '.' + elem;
                            } else {
                                jvar = elem;
                            }

                            type = defArr[0];
                            if (defArr.length > 2) {
                                defArr[1] = defArr.slice(1).join('.');
                            }
                            format = defArr[1];
                            len = plcTypeLen[type];
                            checkAlignment();
                            parseSubStringSlice();
                        }

                    }
                }

                //Calculate the padding bytes at the end of the structure
                if (alignment > 1 && vlenMax > 1 && type !== 'STRING' && type !== 'EndStruct') {
                    if (vlenMax > alignment) {
                        vlenMax = alignment;
                    }
                    mod = subStrAddr % vlenMax;
                    if (mod > 0) {
                        subStrAddr += vlenMax - mod;
                    }
                }
            }

            try {
                response = adsReq.xmlHttpReq.responseXML.documentElement;
                dataString = decodeBase64(response.getElementsByTagName('ppRdData')[0].firstChild.data);

                //Read the error codes of the ADS sub commands.
                for (idx = 0, listlen = itemList.length; idx < listlen; idx++) {

                    dataSubString = dataString.substr(strAddr, 4);
                    errorCode = subStringToData(dataSubString, 'DWORD');

                    if (errorCode !== 0) {
                        log('TAME library error: ADS sub command error while processing a SumReadRequest!');
                        log('Error code: ' + errorCode);
                        log(itemList[idx]);
                    }

                    strAddr += 4;
                }


                //Run through the elements in the item list.
                for (idx = 0; idx < listlen; idx++) {

                    item = itemList[idx];

                    itemInfo = getItemInformation(item);

                    //Get type and formatting string.
                    type = itemInfo.type;
                    format = itemInfo.format;

                    //Get the length of the data types.
                    itemSize = itemInfo.size;

                    //Reset counter for arrays.
                    i = null;

                    //Slice the string and decode the data
                    dataSubString = dataString.substr(strAddr, itemSize);

                    switch (type) {

                        case 'ARRAY':
                            dataObj = parseVarName(item.jvar);
                            subStrAddr = 0;
                            arrayLength = itemInfo.arrayLength;
                            if (itemInfo.arrayDataType === 'USER') {
                                for (i = 0; i < arrayLength; i++) {
                                    parseStructure();
                                }
                            } else {
                                type = itemInfo.arrayDataType;
                                len = plcTypeLen[type];
                                for (i = 0; i < arrayLength; i++) {
                                    jvar = i;
                                    parseSubStringSlice();
                                }
                            }
                            break;
                        case 'USER':
                            dataObj = parseVarName(item.jvar);
                            subStrAddr = 0;
                            parseStructure();
                            break;
                        default:
                            //Convert the data
                            dataObj = window;
                            data = subStringToData(dataSubString, type, format);
                            //Parse the name of the JavaScript variable and write the data to it
                            parseVarName(item.jvar, data, dataObj, item.prefix, item.suffix);

                    }
                    //Set the next string address
                    strAddr += itemSize;

                }
            } catch (e) {
                log('TAME library error: Parsing of SumReadRequest failed:' + e);
                log(item);
                return;
            }
        }


        /**
         * Decode the response string of a SumWriteRequest.
         * 
         * @param {Object} adsReq   ADS Request Object
         */
        function parseSumWriteReq(adsReq) {

            var response,
                itemList = adsReq.reqDescr.items,
                arrType = [],
                arrDeletedHdl = [],
                strAddr = 0,
                subStrAddr = 0,
                dataObj = window,
                item, dataString, dataSubString, data, len, type, format, idx, listlen, errorCode, delIdx, symName;


            //Just look for errors.
            try {
                response = adsReq.xmlHttpReq.responseXML.documentElement;
                dataString = decodeBase64(response.getElementsByTagName('ppRdData')[0].firstChild.data);

                //Read the error codes of the ADS sub commands.
                for (idx = 0, listlen = itemList.length; idx < listlen; idx++) {

                    dataSubString = dataString.substr(strAddr, 4);
                    errorCode = subStringToData(dataSubString, 'DWORD');

                    if (errorCode === 0) {
                        //Release handles request?
                        if (adsReq.reqDescr.isRelHdlReq === true) {
                            symName = itemList[idx].toUpperCase();
                            //Remove the handle from the cache
                            delete handleCache[symName];
                            //Delete the handle in the handle list
                            delIdx = handleNames.indexOf(symName);
                            delete handleNames[delIdx];
                            arrDeletedHdl[idx] = symName;
                        }
                    } else {
                        log('TAME library error: ADS sub command error while processing a SumReadRequest!');
                        log('Error code: ' + errorCode);
                        log(itemList[idx]);
                    }
                    strAddr += 4;
                }

                //Release handles request?
                if (adsReq.reqDescr.isRelHdlReq === true) {
                    //Remove deleted items
                    for (idx = handleNames.length - 1; idx >= 0; idx--) {
                        if (handleNames[idx] === undefined) {
                            handleNames.splice(idx, 1);
                        }
                    }
                    if (handleNames.length === 0) {
                        instance.handleCacheReady = false;
                        log('TAME library info: All handles released.');
                    } else {
                        log('TAME library info: Released handles:');
                        log(arrDeletedHdl);
                    }
                }
            } catch (e) {
                log('TAME library error: Parsing of SumWriteRequest failed:' + e);
                log(item);
                return;
            }

        }


        /**
         * Decode the response string of a ADS State Request and store the data.
         * 
         * @param {Object} adsReq   ADS Reqest Object
         */
        function parseAdsState(adsReq) {

            var response;

            try {
                response = adsReq.xmlHttpReq.responseXML.documentElement;
                instance.adsState = parseInt(response.getElementsByTagName('pAdsState')[0].firstChild.data, 10);
                instance.adsStateTxt = adsStates[instance.adsState];
                instance.deviceState = parseInt(response.getElementsByTagName('pDeviceState')[0].firstChild.data, 10);
            } catch (e) {
                log('TAME library error: Parsing of ADS Read State Request failed:' + e);
                return;
            }
        }

        /**
         * Decode the response string of a ReadWrite Request and store the handles.
         * 
         * @param {Object} adsReq   ADS Request Object
         */
        function parseHandles(adsReq) {

            var response,
                arrSymNames = handleNames,
                strAddr = 0,
                subStrAddr = 0,
                dataString, dataSubString, handleVal, idx, arrlen, errorCode, returnLen;

            response = adsReq.xmlHttpReq.responseXML.documentElement;
            dataString = decodeBase64(response.getElementsByTagName('ppRdData')[0].firstChild.data);

            //Read the error codes and the return length of the ADS sub commands.
            for (idx = 0, arrlen = arrSymNames.length; idx < arrlen; idx++) {

                dataSubString = dataString.substr(strAddr, 4);
                errorCode = subStringToData(dataSubString, 'DWORD');
                strAddr += 4;

                dataSubString = dataString.substr(strAddr, 4);
                returnLen = subStringToData(dataSubString, 'DWORD');
                strAddr += 4;

                if (errorCode !== 0) {
                    log('TAME library error: Error while reading a handle from the PLC!');
                    log('Error code: ' + errorCode);
                    log('Handle: ' + arrSymNames[idx]);
                    throw 'Handle request aborted!';
                }
            }

            //Run through the elements in the symbolName list,
            //get the data out of the string and store it in the cache.
            for (idx = 0; idx < arrlen; idx++) {

                //Slice the string and decode the data
                dataSubString = dataString.substr(strAddr, 4);
                handleVal = subStringToData(dataSubString, 'DWORD');
                strAddr += 4;

                handleCache[arrSymNames[idx]] = handleVal;
            }

            instance.handleCacheReady = true;

            log('TAME library info: Handle cache ready.');
        }


        //======================================================================================
        //                     Functions for Creating Request Descriptors
        //======================================================================================  

        /**
         * Create the Request Descriptor for a single variable. An item list
         * with a single array item is generated.
         * 
         * @param {String} method   The method, either "Read" or "Write".
         * @param {String} type     The PLC data type.
         * @param {Object} args     The arguments for building for the Request Descriptor.
         */
        function createSingleDescriptor(method, type, args) {

            var reqDescr = {},
                arrSymType,
                len, itemInfo;

            args.type = type; //To prevent error messages in getItemInformation()

            itemInfo = getItemInformation(args);
            len = plcTypeLen[type];

            switch (type) {
                case 'STRING':
                    //Change the read length if a value is given.
                    if (isValidStringLen(args.strlen)) {
                        type += '.' + args.strlen;
                        len = args.strlen;
                    } else if (typeof itemInfo.stringLength === 'number') {
                        len = itemInfo.stringLength;
                        type += '.' + len;
                    } else {
                        log('TAME library error: Could not get the length of the string for this request!');
                        log(args);
                    }
                    len++; //Termination
                    break;
                case 'TIME':
                case 'TOD':
                case 'DT':
                case 'DATE':
                case 'DATE_AND_TIME':
                case 'TIME_OF_DAY':
                    //Append the format string to the data type.
                    if (typeof args.format === 'string') {
                        type += '.' + args.format;
                    }
                    break;
                case 'REAL':
                case 'LREAL':
                    //Append the number of decimal places to the data type.
                    if (typeof args.decPlaces === 'number') {
                        type += '.' + args.decPlaces;
                    } else if (typeof args.dp === 'number') {
                        type += '.' + args.dp;
                    }
                    break;
            }

            //Create the Request Descriptor.
            reqDescr = {
                addr: args.addr,
                symbolName: itemInfo.symbolName,
                dataTypeNames: itemInfo.dataTypeNames,
                dataTypeArrIdx: itemInfo.dataTypeArrIdx,
                symbolNameArrIdx: itemInfo.symbolNameArrIdx,
                fullSymbolName: args.name,
                useHandle: args.handle,
                id: args.id,
                oc: args.oc,
                ocd: args.ocd,
                oe: args.oe,
                ot: args.ot,
                readLength: len,
                debug: args.debug,
                sync: args.sync,
                offs: args.offs,
                seq: true,
                items: [{
                    val: args.val,
                    jvar: args.jvar,
                    type: type,
                    prefix: args.prefix,
                    suffix: args.suffix
                }]
            };

            //Call the send function.
            if (method === 'Write') {
                instance.writeReq(reqDescr);
            } else {
                instance.readReq(reqDescr);
            }
        }


        /**
         * Create a Request Descriptor for an array. An item list of
         * single variables is generated.
         * 
         * @param {String} method   The method, either "Read" or "Write".
         * @param {String} type     The data type of the PLC variable.
         * @param {Object} args     The arguments for building the Request Descriptor.
         */
        function createArrayDescriptor(method, type, args) {

            var reqDescr = {},
                dataObj = {},
                arrayLength,
                addrOffset,
                cnt = 0,
                i = 0,
                j = 0,
                len,
                defArr = [],
                lenArrElem,
                lastDefArr,
                structByteLen = 0,
                strlen,
                vlen,
                vlenMax = 0,
                endPadLen = 0,
                mod,
                addr,
                wrtOneOnly,
                arrSymType,
                itemInfo;

            itemInfo = getItemInformation(args);

            //Get the object of the stored data, direct with 'val'
            //for a write request or parsing the name if 'jvar' is given.
            if (method === 'Write' && typeof args.val === 'object') {
                dataObj = args.val;
            } else if (typeof args.jvar === 'string') {
                dataObj = parseVarName(args.jvar);
            } else {
                log('TAME library error: No data object for this ' + method + '-Request defined!');
            }

            if (typeof args.arrlen === 'number') {
                //Override array length if manually set
                arrayLength = args.arrlen;
            } else if (itemInfo.arrayLength !== undefined) {
                //Get the array length from the symbol table.
                arrayLength = itemInfo.arrayLength;
            } else {
                log('TAME library error: Can\'t get the array length for this request!');
                log(args);
            }

            //Check if only one item should be written.
            if (typeof args.item === 'number' && !isNaN(args.item) && method === 'Write') {
                wrtOneOnly = true;
                if (args.item < 0 || args.item > arrayLength - 1) {
                    log('TAME library error: Wrong value for "item"!');
                    log('item: ' + args.item);
                    log('Last array index: ' + (arrayLength - 1));
                }
            }

            /**
             * Function for creating an descriptor for array of structures.
             */
            function createStructArr() {

                var elem;
                //Parse the name of the structure definiton, if it is passed
                //as a string.
                if (typeof args.def === 'string') {
                    args.def = parseVarName(args.def);
                } else if (instance.dataTypeTableReady === true && args.def === undefined) {
                    args.def = createStructDef(itemInfo.dataType);
                } else if (typeof args.def !== 'object') {
                    log('TAME library error: No structure definition found!');
                }

                //Calculate the length of the structure and the padding bytes
                for (elem in args.def) {

                    if (args.def.hasOwnProperty(elem)) {

                        //Separate data type and length.
                        defArr = args.def[elem].split('.');

                        if (defArr[0] === 'ARRAY') {
                            lenArrElem = parseInt(defArr[1], 10);
                            defArr.shift();
                            defArr.shift();
                        } else {
                            lenArrElem = 1;
                        }

                        for (i = 0; i < lenArrElem; i++) {
                            //Set the length of the PLC variable.
                            if (defArr[0] === 'STRING') {
                                if (typeof defArr[1] === 'string') {
                                    strlen = parseInt(defArr[1], 10);
                                }
                                vlen = (isValidStringLen(strlen) ? strlen : plcTypeLen[defArr[0]]) + 1;
                            } else {
                                vlen = plcTypeLen[defArr[0]];
                            }

                            //Add the length of the PLC variables
                            if (alignment > 1 && vlen > 1 && defArr[0] !== 'STRING' && structByteLen > 0) {
                                mod = structByteLen % vlen;
                                if (mod > 0) {
                                    structByteLen += vlen - mod;
                                }
                            }
                            structByteLen += vlen;
                        }
                        //Store the maximum length of the PLC variables
                        //for inserting padding bytes at the end of the structure.
                        if (alignment > 1 && vlen > vlenMax && defArr[0] !== 'STRING') {
                            vlenMax = vlen;
                        }
                    }
                }

                //Calculate the padding bytes at the end of the structure
                if (alignment > 1 && vlenMax > 1 && defArr[0] !== 'STRING') {
                    if (vlenMax > alignment) {
                        vlenMax = alignment;
                    }
                    mod = structByteLen % vlenMax;
                    if (mod > 0) {
                        endPadLen = vlenMax - mod;
                        structByteLen += endPadLen;
                    }
                }

                //Set the address offset and the length to 1 
                //if only one item should be sent.
                if (wrtOneOnly) {
                    addrOffset = structByteLen * args.item;
                    arrayLength = 1;
                }

                reqDescr = {
                    addr: args.addr,
                    symbolName: itemInfo.symbolName,
                    dataTypeNames: itemInfo.dataTypeNames,
                    fullSymbolName: args.name,
                    addrOffset: addrOffset,
                    useHandle: args.handle,
                    id: args.id,
                    oc: args.oc,
                    ocd: args.ocd,
                    oe: args.oe,
                    ot: args.ot,
                    debug: args.debug,
                    readLength: structByteLen * arrayLength,
                    seq: true,
                    calcAlignment: true,
                    dataObj: dataObj,
                    sync: args.sync,
                    offs: args.offs,
                    items: []
                };

                //Create the item list.
                //Although jvar isn't necessary for write requests,
                //it's good for easier debugging.
                for (i = 0; i < arrayLength; i++) {

                    for (elem in args.def) {

                        if (args.def.hasOwnProperty(elem)) {

                            defArr = args.def[elem].split('.');

                            if (defArr[0] === 'ARRAY') {
                                lenArrElem = parseInt(defArr[1], 10);
                                lastDefArr = defArr.length - 1;

                                for (j = 0; j < lenArrElem; j++) {
                                    if (defArr[lastDefArr] === 'SP') {
                                        reqDescr.items[cnt] = {
                                            jvar: i + '.' + elem + j
                                        };
                                        if (lastDefArr === 4) {
                                            reqDescr.items[cnt].type = defArr[2] + '.' + defArr[3];
                                        } else {
                                            reqDescr.items[cnt].type = defArr[2];
                                        }
                                    } else {
                                        reqDescr.items[cnt] = {
                                            jvar: i + '.' + elem + '.' + j
                                        };
                                        if (lastDefArr === 3) {
                                            reqDescr.items[cnt].type = defArr[2] + '.' + defArr[3];
                                        } else {
                                            reqDescr.items[cnt].type = defArr[2];
                                        }
                                    }

                                    if (method === 'Write') {
                                        if (wrtOneOnly) {
                                            if (defArr[lastDefArr] === 'SP') {
                                                reqDescr.items[cnt].val = dataObj[args.item][elem + j];
                                            } else {
                                                reqDescr.items[cnt].val = dataObj[args.item][elem][j];
                                            }
                                        } else {
                                            if (defArr[lastDefArr] === 'SP') {
                                                reqDescr.items[cnt].val = dataObj[i][elem + j];
                                            } else {
                                                reqDescr.items[cnt].val = dataObj[i][elem][j];
                                            }
                                        }
                                    }
                                    cnt++;
                                }
                            } else {
                                reqDescr.items[cnt] = {
                                    jvar: i + '.' + elem,
                                    type: args.def[elem]
                                };
                                if (method === 'Write') {
                                    if (wrtOneOnly) {
                                        reqDescr.items[cnt].val = dataObj[args.item][elem];
                                    } else {
                                        reqDescr.items[cnt].val = dataObj[i][elem];
                                    }
                                }
                                cnt++;
                            }
                        }
                    }
                    //Set an item as a mark at the end of the structure
                    //for inserting padding bytes in "writeReq" and "readReq" later.
                    if (alignment > 1) {
                        reqDescr.items[cnt] = {
                            type: 'EndStruct',
                            val: endPadLen
                        };
                        cnt++;
                    }
                }
            }

            /**
             * Function for creating a descriptor for a simple array.
             */
            function createSimpleArr() {
                len = plcTypeLen[type];

                switch (type) {
                    case 'STRING':
                        if (isValidStringLen(args.strlen)) {
                            //Change the read length if a value is given.
                            type += '.' + args.strlen;
                            len = args.strlen;
                        } else if (typeof itemInfo.stringLength === 'number') {
                            len = itemInfo.stringLength;
                            type += '.' + len;
                        } else {
                            log('TAME library error: Could not get the length of the string for this request!');
                            log(args);
                        }
                        len++; //Termination
                        break;
                    case 'TIME':
                    case 'TOD':
                    case 'DT':
                    case 'DATE':
                    case 'DATE_AND_TIME':
                    case 'TIME_OF_DAY':
                        //Append the format string to the data type.
                        if (typeof args.format === 'string') {
                            type += '.' + args.format;
                        }
                        break;
                    case 'REAL':
                    case 'LREAL':
                        //Append the number of decimal places to the data type.
                        if (typeof args.decPlaces === 'number') {
                            type += '.' + args.decPlaces;
                        }
                        else if (typeof args.dp === 'number') {
                            type += '.' + args.dp;
                        }
                        break;
                }

                //Set the address offset and the length to 1 
                //if only one item should be sent.
                if (wrtOneOnly) {
                    addrOffset = args.item * len;
                    arrayLength = 1;
                }

                reqDescr = {
                    addr: args.addr,
                    symbolName: itemInfo.symbolName,
                    dataTypeNames: itemInfo.dataTypeNames,
                    dataTypeArrIdx: itemInfo.dataTypeArrIdx,
                    symbolNameArrIdx: itemInfo.symbolNameArrIdx,
                    fullSymbolName: args.name,
                    useHandle: args.handle,
                    addrOffset: addrOffset,
                    id: args.id,
                    oc: args.oc,
                    ocd: args.ocd,
                    oe: args.oe,
                    ot: args.ot,
                    readLength: len * arrayLength,
                    debug: args.debug,
                    seq: true,
                    dataObj: dataObj,
                    items: []
                };

                //Create the item list.
                //Although jvar isn't necessary for write requests,
                //it's good for easier debugging.
                for (i = 0; i < arrayLength; i++) {
                    reqDescr.items[i] = {
                        jvar: i,
                        type: type
                    };
                    if (method === 'Write') {
                        if (wrtOneOnly) {
                            reqDescr.items[i].val = dataObj[args.item];
                        } else {
                            reqDescr.items[i].val = dataObj[i];
                        }
                    }
                }
            }


            if (type === 'STRUCT') {
                createStructArr();
            } else {
                createSimpleArr();
            }

            //Call the send function.
            if (method === 'Write') {
                instance.writeReq(reqDescr);
            } else {
                instance.readReq(reqDescr);
            }
        }


        /**
         * Create a Request Descriptor for a structure,
         * a structure definition has to be passed as one of the arguments,
         * from wich the item list is created.
         * 
         * @param {String} method   The method, either "Read" or "Write".
         * @param {Object} args     The arguments for building the Request Descriptor.
         */
        function createStructDescriptor(method, args) {

            var reqDescr = {},      //Request Descriptor
                dataObj = {},       //object wich holds the data for write requests 
                defArr = [],        //subelements of a structure definition item
                cnt = 0,
                lastDefArr,
                lenArrElem,
                elem,
                j,
                itemInfo;

            itemInfo = getItemInformation(args);

            //Get the object of the stored data, direct with 'val'
            //for a write request or parsing the name if 'jvar' is given.
            if (method === 'Write' && typeof args.val === 'object') {
                dataObj = args.val;
            } else if (typeof args.jvar === 'string') {
                dataObj = parseVarName(args.jvar);
            } else {
                log('TAME library error: No data object for this ' + method + '-Request defined!');
            }

            //Parse the name of the structure definiton, if it is passed
            //as a string.
            if (typeof args.def === 'string') {
                args.def = parseVarName(args.def);
            } else if (instance.dataTypeTableReady === true && args.def === undefined) {
                args.def = createStructDef(itemInfo.dataType);
            } else if (typeof args.def !== 'object') {
                log('TAME library error: No structure defininition found (createArrayDescriptor())!');
                log(args);
            }

            reqDescr = {
                addr: args.addr,
                symbolName: itemInfo.symbolName,
                dataTypeNames: itemInfo.dataTypeNames,
                dataTypeArrIdx: itemInfo.dataTypeArrIdx,
                symbolNameArrIdx: itemInfo.symbolNameArrIdx,
                fullSymbolName: args.name,
                useHandle: args.handle,
                id: args.id,
                oc: args.oc,
                ocd: args.ocd,
                oe: args.oe,
                ot: args.ot,
                debug: args.debug,
                seq: true,
                calcAlignment: true,
                dataObj: dataObj,
                sync: args.sync,
                offs: args.offs,
                items: []
            };

            //Create the item list.
            //Although jvar isn't necessary for write requests,
            //it's good for easier debugging.
            for (elem in args.def) {

                if (args.def.hasOwnProperty(elem)) {

                    defArr = args.def[elem].split('.');

                    if (defArr[0] === 'ARRAY') {
                        lenArrElem = parseInt(defArr[1], 10);
                        lastDefArr = defArr.length - 1;
                        for (j = 0; j < lenArrElem; j++) {
                            if (defArr[lastDefArr] === 'SP') {
                                reqDescr.items[cnt] = {
                                    jvar: elem + j
                                };
                                if (lastDefArr === 4) {
                                    reqDescr.items[cnt].type = defArr[2] + '.' + defArr[3];
                                } else {
                                    reqDescr.items[cnt].type = defArr[2];
                                }
                            } else {
                                reqDescr.items[cnt] = {
                                    jvar: elem + '.' + j
                                };
                                if (lastDefArr === 3) {
                                    reqDescr.items[cnt].type = defArr[2] + '.' + defArr[3];
                                } else {
                                    reqDescr.items[cnt].type = defArr[2];
                                }
                            }
                            if (method === 'Write') {
                                if (defArr[lastDefArr] === 'SP') {
                                    reqDescr.items[cnt].val = dataObj[elem + j];
                                } else {
                                    reqDescr.items[cnt].val = dataObj[elem][j];
                                }
                            }
                            cnt++;
                        }
                    } else {
                        reqDescr.items[cnt] = {
                            jvar: elem,
                            type: args.def[elem]
                        };
                        if (method === 'Write') {
                            reqDescr.items[cnt].val = dataObj[elem];
                        }
                        cnt++;
                    }
                }
            }

            //Call the send function
            if (method === 'Write') {
                instance.writeReq(reqDescr);
            } else {
                instance.readReq(reqDescr);
            }
        }



        //======================================================================================
        //                                Public Methods
        //======================================================================================

        /**
         * This is the function for creating a write request. Depending on the
         * values and PLC data types passed in the variable list a byte array is
         * created and the function for sending the request is called.
         * 
         * @param {Object}  reqDescr    The Request Descriptor. Besides other information
         *                              this object contains the allocation of PLC and
         *                              JavaScript variables in an item list.
         */
        this.writeReq = function (reqDescr) {

            var itemList = reqDescr.items,
                adsReq = {},
                pData = [],
                arrType = [],
                bytes = [],
                type, format, listlen, len, val, pcount, mod, item, i, idx;

            //Set the variable name to upper case.
            if (typeof reqDescr.name === 'string') {
                reqDescr.name = reqDescr.name.toUpperCase();
            }

            //Run through the elements in the item list.
            for (idx = 0, listlen = itemList.length; idx < listlen; idx++) {

                item = itemList[idx];

                //Get type and formatting string.
                arrType = getTypeAndFormat(item);
                type = arrType[0];
                format = arrType[1];

                //Length of the data type.
                //Maximum lenght is limited to 4 (due to structure padding),
                //the lenght of strings is calculated later.
                if (isNaN(plcTypeLen[type])) {
                    log('TAME library error: Could not get the length of the data type: ' + type);
                    log('TAME library error: Probably wrong type definition. Please check the manual.');
                    log(reqDescr);
                    return;
                }

                //Padding within structures.
                //"calcAlignment" is only set in "writeStruct/readStruct" and
                //"writeArrayOfStruct/readArrayOfStruct"
                len = (plcTypeLen[type] < alignment) ? plcTypeLen[type] : alignment;

                if (reqDescr.calcAlignment === true && len > 1 && type !== 'STRING' && type !== 'EndStruct' && pData.length > 0) {
                    mod = pData.length % len;
                    if (mod > 0) {
                        pcount = len - mod;
                        for (i = 1; i <= pcount; i++) {
                            pData.push(0);
                        }
                    }
                }

                //Convert data, depending on the type
                if (type === 'EndStruct') {
                    //Calculate the padding bytes at the end of the structure
                    //"EndStruct" is only used with "readArrayOfStructures/writeArrayOfStructures".
                    for (i = 1; i <= item.val; i++) {
                        pData.push(0);
                    }
                } else {
                    //Convert the data to a byte array.
                    bytes = dataToByteArray(item, type, format, plcTypeLen[type]);
                    //Summarise the data.     
                    pData = pData.concat(bytes);
                }
            }

            //Convert the data to Base64.
            if (pData && pData.length > 0) {
                pData = encodeBase64(pData);
            }

            //Generate the ADS request object and call the send function.
            adsReq = {
                method: 'Write',
                indexGroup: getIndexGroup(reqDescr),
                indexOffset: getIndexOffset(reqDescr),
                pData: pData,
                reqDescr: reqDescr
            };
            createRequest(adsReq).send();
        };


        /**
         * This is the function for creating a read request. If no value for the
         * data length ist passed, calculate the value and then call the function 
         * for sending the request.
         * 
         * @param {Object}  reqDescr    The Request Descriptor. Besides other information
         *                              this object contains the allocation of PLC and
         *                              JavaScript variables in an item list.
         */
        this.readReq = function (reqDescr) {

            var adsReq = {},
                itemList = reqDescr.items,
                arrType = [],
                item, format, type, listlen, mod, vlen, strlen, idx, startaddr;

            //Calculate the data length if no argument is given.
            if (typeof reqDescr.readLength !== 'number') {

                reqDescr.readLength = 0;

                for (idx = 0, listlen = itemList.length; idx < listlen; idx++) {

                    item = itemList[idx];

                    //Get type and formatting string.
                    arrType = getTypeAndFormat(item);
                    type = arrType[0];
                    format = arrType[1];

                    //Set the length of the PLC variable.
                    if (isNaN(plcTypeLen[type])) {
                        log('TAME library error: Could not get the length of the data type: ' + type);
                        log('TAME library error: Probably wrong type definition. Please check the manual.');
                        log(reqDescr);
                        return;
                    }
                    if (type === 'STRING') {
                        if (typeof format === 'string') {
                            strlen = parseInt(format, 10);
                        }
                        vlen = (isValidStringLen(strlen) ? strlen : plcTypeLen[type]) + 1;
                    } else {
                        vlen = plcTypeLen[type];
                    }

                    if (reqDescr.seq === true) {
                        //Add the length of the PLC variables if continuously addressing is used.
                        if (reqDescr.calcAlignment === true && vlen > 1 && type !== 'EndStruct' && type !== 'STRING' && reqDescr.readLength > 0) {
                            mod = reqDescr.readLength % vlen;
                            if (mod > 0) {
                                reqDescr.readLength += vlen - mod;
                            }
                        }
                        reqDescr.readLength += vlen;
                    } else {
                        //Last element if single addresses are given.
                        startaddr = getIndexOffset(reqDescr);
                        reqDescr.readLength = vlen + item.addr - startaddr;
                    }
                }
            }


            //Generate the ADS request object and call the send function.
            adsReq = {
                method: 'Read',
                indexGroup: getIndexGroup(reqDescr),
                indexOffset: getIndexOffset(reqDescr),
                reqDescr: reqDescr
            };
            createRequest(adsReq).send();
        };


        /**
         * This is the function for creating a sum read request.
         * 
         * @param {Object}  reqDescr    The Request Descriptor. Besides other information
         *                              this object contains the allocation of PLC and
         *                              JavaScript variables in an item list.
         */
        this.sumReadReq = function (reqDescr) {
            var adsReq = {},
                itemList = reqDescr.items,
                arrType = [],
                reqBuffer = [],
                bytes = [],
                listlen = itemList.length,
                dummy = {},
                type, format, item, idx, len, pwrData, itemInfo;

            //Preset the read lenth with the number of byte for error codes.
            reqDescr.readLength = listlen * 4;

            //Build the Request Buffer
            for (idx = 0; idx < listlen; idx++) {

                item = itemList[idx];

                itemInfo = getItemInformation(item);

                //Length of the data type.
                len = itemInfo.size;

                reqDescr.readLength += len;

                //Build the request buffer.
                //The function dataToByteArray expects an item with a value for
                //converting, so a dummy object is used here.
                dummy.val = getIndexGroup(itemInfo);
                bytes = dataToByteArray(dummy, 'UDINT', format, 4);
                reqBuffer = reqBuffer.concat(bytes);

                dummy.val = getIndexOffset(itemInfo);
                bytes = dataToByteArray(dummy, 'UDINT', format, 4);
                reqBuffer = reqBuffer.concat(bytes);

                dummy.val = len;
                bytes = dataToByteArray(dummy, 'UDINT', format, 4);
                reqBuffer = reqBuffer.concat(bytes);

            }

            //Convert the request buffer to Base64 coded data.
            if (reqBuffer.length > 0) {
                pwrData = encodeBase64(reqBuffer);
            }

            //Generate the ADS request object and call the send function.
            adsReq = {
                method: 'ReadWrite',
                indexGroup: indexGroups.SumRd,
                indexOffset: itemList.length,
                pwrData: pwrData,
                reqDescr: reqDescr
            };
            createRequest(adsReq).send();
        };


        /**
         * This is the function for creating a sum write request.
         * 
         * @param {Object}  reqDescr    The Request Descriptor. Besides other information
         *                              this object contains the allocation of PLC and
         *                              JavaScript variables in an item list.
         */
        this.sumWriteReq = function (reqDescr) {
            var adsReq = {},
                itemList = reqDescr.items,
                arrType = [],
                reqBuffer = [],
                bytes = [],
                listlen = itemList.length,
                dummy = {},
                vlenMax = 0,
                type, format, item, idx, len, pwrData, i, k, arrayLength, mod, pcount, itemInfo;


            /**
             * Function for getting the length of a variable.
             */
            function getVarLength() {
                var strlen;

                len = plcTypeLen[type];

                if (type === 'STRING') {
                    if (format !== undefined) {
                        strlen = parseInt(format, 10);
                    } else if (typeof itemInfo.stringLength === 'number') {
                        strlen = itemInfo.stringLength;
                    }
                    format = (isValidStringLen(strlen) ? strlen : len);
                }
            }

            /*
             * Parse the stucture definition.
             */
            function parseStruct() {

                var j, defArr, lenArrElem, lastDefArr, mod, elem, subBuffer = [];

                /**
                 * Function for adding padding bytes if an alignment is used. 
                 */
                function checkAlignment() {

                    var vlen, k;

                    if (alignment > 1 && type !== 'STRING' && type !== 'EndStruct') {
                        //Set the length for calculating padding bytes
                        vlen = len < alignment ? len : alignment;

                        //Compute the padding bytes for the alignment.
                        if (vlen > 1 && subBuffer.length > 0) {
                            mod = subBuffer.length % vlen;
                            if (mod > 0) {
                                pcount = vlen - mod;
                                for (k = 1; k <= pcount; k++) {
                                    subBuffer.push(0);
                                }
                            }
                        }

                        //Store the maximum length of the PLC variables
                        //for inserting padding bytes at the end of the structure.
                        if (vlen > vlenMax) {
                            vlenMax = vlen;
                        }
                    }
                }

                //Check structure definition
                if (typeof item.def === 'string') {
                    item.def = parseVarName(item.def);
                } else if (instance.dataTypeTableReady === true && item.def === undefined) {
                    item.def = createStructDef(itemInfo.dataType);
                } else if (typeof item.def !== 'object') {
                    log('TAME library error: No structure defininition found (sumWriteReq())!');
                    log(item);
                }

                //Walk through the structure definiton
                for (elem in item.def) {

                    if (item.def.hasOwnProperty(elem)) {

                        try {
                            defArr = item.def[elem].split('.');

                            if (defArr[0] === 'ARRAY') {
                                lenArrElem = parseInt(defArr[1], 10);
                                lastDefArr = defArr.length - 1;
                                for (j = 0; j < lenArrElem; j++) {
                                    type = defArr[2];
                                    if (defArr[lastDefArr] === 'SP') {
                                        if (lastDefArr >= 4) {
                                            format = defArr.slice(3, -1).join('.');
                                        }
                                    } else {
                                        if (lastDefArr >= 3) {
                                            format = defArr.slice(3).join('.');
                                        }
                                    }

                                    //Add index in case of an array of struct
                                    if (i !== null) {
                                        if (defArr[lastDefArr] === 'SP') {
                                            dummy.val = item.val[i][elem + j];
                                        } else {
                                            dummy.val = item.val[i][elem][j];
                                        }
                                    } else {
                                        dummy.val = item.val[elem][j];
                                    }

                                    getVarLength();
                                    checkAlignment();
                                    bytes = dataToByteArray(dummy, type, format, len);
                                    subBuffer = subBuffer.concat(bytes);
                                }
                            } else {

                                //Check if we are in an array of struct
                                if (i !== null) {
                                    dummy.val = item.val[i][elem];
                                } else {
                                    dummy.val = item.val[elem];
                                }

                                type = defArr[0];
                                if (defArr.length > 2) {
                                    defArr[1] = defArr.slice(1).join('.');
                                }
                                format = defArr[1];
                                getVarLength();

                                checkAlignment();
                                bytes = dataToByteArray(dummy, type, format, len);
                                subBuffer = subBuffer.concat(bytes);
                            }

                        } catch (e) {
                            log('TAME library error: Could not set values for a structure in SumWriteReq: ' + e);
                            log(item);
                        }
                    }
                }

                //Calculate the padding bytes at the end of the structure.
                if (alignment > 1 && vlenMax > 1 && defArr[0] !== 'STRING' && defArr[0] !== 'EndStruct') {
                    mod = subBuffer.length % vlenMax;
                    if (mod > 0) {
                        pcount = vlenMax - mod;
                        for (k = 1; k <= pcount; k++) {
                            subBuffer.push(0);
                        }
                    }
                }

                //Add the subPuffer with the structure data to the request buffer.
                reqBuffer = reqBuffer.concat(subBuffer);
            }

            //Preset the read length with the number of byte for error codes.
            reqDescr.readLength = listlen * 4;

            //Write the general command information to the Request Buffer
            for (idx = 0; idx < listlen; idx++) {

                item = itemList[idx];

                itemInfo = getItemInformation(item);

                //Get type and formatting string.
                type = itemInfo.type;
                format = itemInfo.format;

                //Length of the data type.
                len = itemInfo.size;

                //Build the request buffer.
                //The function dataToByteArray expects an item with a value for
                //converting, so a dummy object is used here.
                dummy.val = getIndexGroup(itemInfo);
                bytes = dataToByteArray(dummy, 'UDINT', format, 4);
                reqBuffer = reqBuffer.concat(bytes);

                dummy.val = getIndexOffset(itemInfo);
                bytes = dataToByteArray(dummy, 'UDINT', format, 4);
                reqBuffer = reqBuffer.concat(bytes);

                dummy.val = len;
                bytes = dataToByteArray(dummy, 'UDINT', format, 4);
                reqBuffer = reqBuffer.concat(bytes);

            }

            //Write the data to the Request Buffer
            for (idx = 0; idx < listlen; idx++) {

                item = itemList[idx];

                itemInfo = getItemInformation(item);

                //Get type and formatting string.
                type = itemInfo.type;
                format = itemInfo.format;

                //Length of the data type.
                len = itemInfo.size;

                //Reset counter for arrays.
                i = null;

                //Build the request buffer.
                //The function dataToByteArray expects an item with a value for
                //converting, so a dummy object is used here.
                switch (type) {

                    case 'ARRAY':

                        arrayLength = parseInt(itemInfo.arrayLength, 10);

                        if (arrayLength !== item.val.length) {
                            log('TAME library error: Array length in JS differs from the length in the PLC!');
                            log('Length in JS: ' + item.val.length);
                            log('Length in PLC: ' + arrayLength);
                            log(item);
                            return;
                        }

                        if (itemInfo.arrayDataType === 'USER') {
                            //Array of structures.
                            for (i = 0; i < arrayLength; i++) {
                                parseStruct();
                            }

                        } else {
                            //Plain array.
                            type = itemInfo.arrayDataType;

                            if (type === 'STRING') {
                                format = itemInfo.stringLength;
                            } else {
                                len = itemInfo.itemSize;
                            }

                            for (i = 0; i < arrayLength; i++) {
                                dummy.val = item.val[i];
                                bytes = dataToByteArray(dummy, type, format, len);
                                reqBuffer = reqBuffer.concat(bytes);
                            }
                        }
                        break;
                    case 'USER':
                        //Structures.
                        parseStruct();
                        break;
                    default:
                        //Simple data types.
                        if (type === 'STRING') {
                            format = itemInfo.stringLength;
                        } else {
                            len = itemInfo.size;
                        }
                        bytes = dataToByteArray(item, type, format, len);
                        reqBuffer = reqBuffer.concat(bytes);
                }
            }

            //Convert the request buffer to Base64 coded data.
            if (reqBuffer.length > 0) {
                pwrData = encodeBase64(reqBuffer);
            }

            //Generate the ADS request object and call the send function.
            adsReq = {
                method: 'ReadWrite',
                indexGroup: indexGroups.SumWr,
                indexOffset: itemList.length,
                pwrData: pwrData,
                reqDescr: reqDescr
            };
            createRequest(adsReq).send();
        };


        /**
         * This is the function for reading the ADS state.
         * 
         * @param {Object}  reqDescr    The Request Descriptor. Besides other information
         *                              this object contains the allocation of PLC and
         *                              JavaScript variables in an item list.
         */
        this.readAdsState = function (reqDescr) {
            //Generate the ADS request object and call the send function.

            var oefunct;

            if (reqDescr === undefined) {
                reqDescr = {};
            } else if (typeof reqDescr.oe == 'function') {
                //Save the original on-error function if exist.
                oefunct = reqDescr.oe;
            }

            //On-error-function, reset the state
            reqDescr.oe = function () {
                log('TAME library error: ADS state request failed.');
                instance.adsState = null;
                instance.adsStateTxt = '';
                instance.deviceState = null;

                if (typeof oefunct == 'function') {
                    oefunct();
                }
            };

            var adsReq = {
                method: 'ReadState',
                reqDescr: reqDescr
            };
            createRequest(adsReq).send();
        };


        /**
         *  Prints the cached handles to the console.
         */
        this.logHandleCache = function () {
            log(handleCache);
        };

        /**
         *  Prints the symbol table to the console.
         */
        this.logSymbols = function () {
            log(symTable);
        };


        /**
         *  Prints the data type table to the console.
         */
        this.logDataTypes = function () {
            log(dataTypeTable);
        };


        /**
         * Converts the Symbol Table to a JSON string.
         * 
         * @return {Array}  jstr    The Symbol Table as a JSON string . 
         */
        this.getSymbolsAsJSON = function () {
            var jstr;

            if (typeof JSON !== 'object') {
                log('TAME library error: No JSON parser found.');
            } else {
                try {
                    jstr = JSON.stringify(symTable);
                    return jstr;
                } catch (e) {
                    log('TAME library error: Could not convert the Symbol Table to JSON:' + e);
                }
            }
        };


        /**
         * Reads the Symbol Table from a JSON string
         * 
         * @param {String}  jstr    A JSON string with the symbols.
         */
        this.setSymbolsFromJSON = function (jstr) {
            if (typeof JSON !== 'object') {
                log('TAME library error: No JSON parser found.');
            } else {
                try {
                    symTable = JSON.parse(jstr);
                } catch (e) {
                    log('TAME library error: Could not create the Symbol Table from JSON:' + e);
                    return;
                }
                instance.symTableReady = true;
                log('TAME library info: Symbol Table successfully created from JSON data.');
            }
        };


        /**
         * Converts the Data Type Table to a JSON string.
         * 
         * @return {Array}  jstr    The Data Type Table as a JSON string . 
         */
        this.getDataTypesAsJSON = function () {
            var jstr;

            if (typeof JSON !== 'object') {
                log('TAME library error: No JSON parser found.');
            } else {
                try {
                    jstr = JSON.stringify(dataTypeTable);
                    return jstr;
                } catch (e) {
                    log('TAME library error: Could not convert the Data Type Table to JSON:' + e);
                }
            }
        };


        /**
         * Reads the Data Type Table from a JSON string
         * 
         * @param {String}  jstr    A JSON string with the data types.
         */
        this.setDataTypesFromJSON = function (jstr) {
            if (typeof JSON !== 'object') {
                log('TAME library error: No JSON parser found.');
            } else {
                try {
                    dataTypeTable = JSON.parse(jstr);
                } catch (e) {
                    log('TAME library error: Could not create the Data Type Table from JSON:' + e);
                    return;
                }
                instance.dataTypeTableReady = true;
                log('TAME library info: Data Type Table successfully created from JSON data.');
            }
        };


        /**
         * Process the webservice's server response.
         * 
         * @param {Object} adsReq   The object containing the arguments of the ADS request.
         */
        this.parseResponse = function (adsReq) {

            var response, errorCode, errorText;

            //Acknowledge the receive of a request with index 'id'.
            if (typeof adsReq.reqDescr.id === 'number') {
                currReq[adsReq.reqDescr.id] = 0;
            }

            //Check if the XML data object is valid.
            if (adsReq.xmlHttpReq.responseXML === null) {
                log('TAME library error: Request contains no XML data. Object "responseXML" is null.');
                log('TAME library error: This is the "responseText":');
                log(adsReq.xmlHttpReq.responseText);
                if (typeof adsReq.reqDescr.oe === 'function') {
                    //on error function
                    adsReq.reqDescr.oe();
                }
                return;
            }

            //Get the response
            try {
                response = adsReq.xmlHttpReq.responseXML.documentElement;
            } catch (e) {
                log('TAME library error: No XML data in server response: ' + e);
                if (typeof adsReq.reqDescr.oe === 'function') {
                    //on error function
                    adsReq.reqDescr.oe();
                }
                return;
            }

            //Look for errors in the response string (i.e. ADS errors).
            try {
                //Get errors
                errorText = response.getElementsByTagName('faultstring')[0].firstChild.data;
                try {
                    errorCode = response.getElementsByTagName('errorcode')[0].firstChild.data;
                } catch (e) {
                    errorCode = '-';
                }
                log('TAME library error: Message from server:  ' + errorText + ' (' + errorCode + ')');

                if (typeof adsReq.reqDescr.oe === 'function') {
                    //on error function
                    adsReq.reqDescr.oe();
                }
                return;
            } catch (ex) {
                //All fine
                errorCode = 0;
            }

            //Normalize data (esp. for Firefox, who splits data in 4k chunks).
            if (typeof response.normalize === 'function') {
                response.normalize();
            }

            //Decode data if it's a read request.
            if (adsReq.method === 'ReadState') {

                parseAdsState(adsReq);

            } else if (adsReq.method === 'Read' || adsReq.method === 'ReadWrite') {

                switch (adsReq.indexGroup) {
                    case indexGroups.UploadInfo:
                        parseUploadInfo(adsReq);
                        break;
                    case indexGroups.Upload:
                        parseUpload(adsReq);
                        break;
                    case indexGroups.SumRd:
                        parseSumReadReq(adsReq);
                        break;
                    case indexGroups.SumWr:
                        parseSumWriteReq(adsReq);
                        break;
                    case indexGroups.SumRdWr:
                        parseHandles(adsReq);
                        break;
                    default:
                        parseReadReq(adsReq);
                }
            }

            //Call the On-Complete-Script.
            if (typeof adsReq.reqDescr.oc === 'function') {
                if (typeof adsReq.reqDescr.ocd === 'number') {
                    window.setTimeout(adsReq.reqDescr.oc, adsReq.reqDescr.ocd);
                }
                else {
                    adsReq.reqDescr.oc();
                }
            }
        };


        /**
         * Get the handles from the PLC.
         * 
         * @param {Array} arrSymNames   Array with the symbol names.
         */
        this.getHandles = function (reqDescr) {

            var adsReq = {},
                reqBuffer = [],
                arrlen = reqDescr.symbols.length,
                bytes, idx, len, pwrData, format, symname, i;

            log('TAME library info: Fetching handles from the PLC.');

            //Read lenth with the number of byte for error codes.
            //4 bytes requested data, 4 bytes for errorcode and 4 bytes for the length
            reqDescr.readLength = arrlen * 12;

            //Build the Request Buffer
            for (idx = 0; idx < arrlen; idx++) {

                //Build the request buffer.
                //IndexGroup
                bytes = numToByteArr(indexGroups.HandleByName, 4);
                reqBuffer = reqBuffer.concat(bytes);

                //IndexOffset is always 0
                bytes = numToByteArr(0, 4);
                reqBuffer = reqBuffer.concat(bytes);

                //Handle size (4 bytes)
                bytes = numToByteArr(4, 4);
                reqBuffer = reqBuffer.concat(bytes);

                //String length
                bytes = numToByteArr(reqDescr.symbols[idx].length, 4);
                reqBuffer = reqBuffer.concat(bytes);
            }

            //Add symbol names
            for (idx = 0; idx < arrlen; idx++) {
                symname = reqDescr.symbols[idx].toUpperCase();

                //Store it for later use
                handleNames[idx] = symname;

                //Add symbol names to the buffer
                bytes = [];
                for (i = 0; i < symname.length; i++) {
                    bytes[i] = symname.charCodeAt(i);
                }
                reqBuffer = reqBuffer.concat(bytes);
            }


            //Convert the request buffer to Base64 coded data.
            if (reqBuffer.length > 0) {
                pwrData = encodeBase64(reqBuffer);
            }

            //Generate the ADS request object and call the send function.
            adsReq = {
                method: 'ReadWrite',
                indexGroup: indexGroups.SumRdWr,
                indexOffset: arrlen,
                pwrData: pwrData,
                reqDescr: reqDescr
            };
            createRequest(adsReq).send();
        };


        /**
         * This is the function for releasing the cached handles.
         * 
         */
        this.releaseHandles = function (reqDescr) {
            var adsReq = {},
                reqBuffer = [],
                bytes = [],
                arrlen = 0,
                symNames = [],
                i = 0,
                idx, pwrData;

            log('TAME library info: Releasing handles.');

            //Check if a request descriptor exists
            if (reqDescr === undefined) {
                reqDescr = {};
            }
            //Check if a user defined handle list exists
            if (reqDescr.symbols !== undefined) {
                arrlen = reqDescr.symbols.length;
                for (idx = 0; idx < arrlen; idx++) {
                    symNames[idx] = reqDescr.symbols[idx].toUpperCase();
                }
            } else {
                arrlen = handleNames.length;
                symNames = handleNames;
            }

            //Preset the read length with the number of byte for error codes.
            reqDescr.readLength = arrlen * 4;

            //Write the general command information to the Request Buffer
            for (idx = 0; idx < arrlen; idx++) {

                //Build the request buffer.
                //IndexGroup
                bytes = numToByteArr(indexGroups.ReleaseHandle, 4);
                reqBuffer = reqBuffer.concat(bytes);

                //IndexOffset is always 0
                bytes = numToByteArr(0, 4);
                reqBuffer = reqBuffer.concat(bytes);

                //Handle size (4 bytes)
                bytes = numToByteArr(4, 4);
                reqBuffer = reqBuffer.concat(bytes);
            }

            //Add handles codes
            for (idx = 0; idx < arrlen; idx++) {
                if (typeof handleCache[symNames[idx]] === 'number') {
                    bytes = numToByteArr(handleCache[symNames[idx]], 4);
                    reqBuffer = reqBuffer.concat(bytes);
                } else {
                    log('TAME library error: Handle for symbol name ' + symNames[idx] + ' does not exist in handle cache!');
                    throw 'Releasing Handles aborted!';
                }
            }

            //Convert the request buffer to Base64 coded data.
            if (reqBuffer.length > 0) {
                pwrData = encodeBase64(reqBuffer);
            }

            //Add the symbol names for parsing the response
            reqDescr.items = symNames;

            //This is a Release Handles Request
            reqDescr.isRelHdlReq = true;

            //Generate the ADS request object and call the send function.
            adsReq = {
                method: 'ReadWrite',
                indexGroup: indexGroups.SumWr,
                indexOffset: arrlen,
                pwrData: pwrData,
                reqDescr: reqDescr
            };
            createRequest(adsReq).send();
        };

        /**
         * The shortcuts for reading and writing data.
         * 
         * @param {Object} args
         */
        this.writeBool = function (args) { createSingleDescriptor('Write', 'BOOL', args); };
        this.writeByte = function (args) { createSingleDescriptor('Write', 'BYTE', args); };
        this.writeUsint = function (args) { createSingleDescriptor('Write', 'USINT', args); };
        this.writeSint = function (args) { createSingleDescriptor('Write', 'SINT', args); };
        this.writeWord = function (args) { createSingleDescriptor('Write', 'WORD', args); };
        this.writeUint = function (args) { createSingleDescriptor('Write', 'UINT', args); };
        this.writeInt = function (args) { createSingleDescriptor('Write', 'INT', args); };
        this.writeInt1Dp = function (args) { createSingleDescriptor('Write', 'INT1DP', args); };
        this.writeInt2Dp = function (args) { createSingleDescriptor('Write', 'INT2DP', args); };
        this.writeDword = function (args) { createSingleDescriptor('Write', 'DWORD', args); };
        this.writeUdint = function (args) { createSingleDescriptor('Write', 'UDINT', args); };
        this.writeDint = function (args) { createSingleDescriptor('Write', 'DINT', args); };
        this.writeReal = function (args) { createSingleDescriptor('Write', 'REAL', args); };
        this.writeLreal = function (args) { createSingleDescriptor('Write', 'LREAL', args); };
        this.writeString = function (args) { createSingleDescriptor('Write', 'STRING', args); };
        this.writeTime = function (args) { createSingleDescriptor('Write', 'TIME', args); };
        this.writeTod = function (args) { createSingleDescriptor('Write', 'TOD', args); };
        this.writeDate = function (args) { createSingleDescriptor('Write', 'DATE', args); };
        this.writeDt = function (args) { createSingleDescriptor('Write', 'DT', args); };

        this.readBool = function (args) { createSingleDescriptor('Read', 'BOOL', args); };
        this.readByte = function (args) { createSingleDescriptor('Read', 'BYTE', args); };
        this.readUsint = function (args) { createSingleDescriptor('Read', 'USINT', args); };
        this.readSint = function (args) { createSingleDescriptor('Read', 'SINT', args); };
        this.readWord = function (args) { createSingleDescriptor('Read', 'WORD', args); };
        this.readUint = function (args) { createSingleDescriptor('Read', 'UINT', args); };
        this.readInt = function (args) { createSingleDescriptor('Read', 'INT', args); };
        this.readInt1Dp = function (args) { createSingleDescriptor('Read', 'INT1DP', args); };
        this.readInt2Dp = function (args) { createSingleDescriptor('Read', 'INT2DP', args); };
        this.readDword = function (args) { createSingleDescriptor('Read', 'DWORD', args); };
        this.readUdint = function (args) { createSingleDescriptor('Read', 'UDINT', args); };
        this.readDint = function (args) { createSingleDescriptor('Read', 'DINT', args); };
        this.readReal = function (args) { createSingleDescriptor('Read', 'REAL', args); };
        this.readLreal = function (args) { createSingleDescriptor('Read', 'LREAL', args); };
        this.readString = function (args) { createSingleDescriptor('Read', 'STRING', args); };
        this.readTime = function (args) { createSingleDescriptor('Read', 'TIME', args); };
        this.readTod = function (args) { createSingleDescriptor('Read', 'TOD', args); };
        this.readDate = function (args) { createSingleDescriptor('Read', 'DATE', args); };
        this.readDt = function (args) { createSingleDescriptor('Read', 'DT', args); };

        this.writeStruct = function (args) { createStructDescriptor('Write', args); };
        this.readStruct = function (args) { createStructDescriptor('Read', args); };

        this.writeArrayOfBool = function (args) { createArrayDescriptor('Write', 'BOOL', args); };
        this.writeArrayOfByte = function (args) { createArrayDescriptor('Write', 'BYTE', args); };
        this.writeArrayOfUsint = function (args) { createArrayDescriptor('Write', 'USINT', args); };
        this.writeArrayOfSint = function (args) { createArrayDescriptor('Write', 'SINT', args); };
        this.writeArrayOfWord = function (args) { createArrayDescriptor('Write', 'WORD', args); };
        this.writeArrayOfUint = function (args) { createArrayDescriptor('Write', 'UINT', args); };
        this.writeArrayOfInt = function (args) { createArrayDescriptor('Write', 'INT', args); };
        this.writeArrayOfInt1Dp = function (args) { createArrayDescriptor('Write', 'INT1DP', args); };
        this.writeArrayOfInt2Dp = function (args) { createArrayDescriptor('Write', 'INT2DP', args); };
        this.writeArrayOfDword = function (args) { createArrayDescriptor('Write', 'DWORD', args); };
        this.writeArrayOfUdint = function (args) { createArrayDescriptor('Write', 'UDINT', args); };
        this.writeArrayOfDint = function (args) { createArrayDescriptor('Write', 'DINT', args); };
        this.writeArrayOfReal = function (args) { createArrayDescriptor('Write', 'REAL', args); };
        this.writeArrayOfLreal = function (args) { createArrayDescriptor('Write', 'LREAL', args); };
        this.writeArrayOfString = function (args) { createArrayDescriptor('Write', 'STRING', args); };
        this.writeArrayOfTime = function (args) { createArrayDescriptor('Write', 'TIME', args); };
        this.writeArrayOfTod = function (args) { createArrayDescriptor('Write', 'TOD', args); };
        this.writeArrayOfDate = function (args) { createArrayDescriptor('Write', 'DATE', args); };
        this.writeArrayOfDt = function (args) { createArrayDescriptor('Write', 'DT', args); };
        this.writeArrayOfStruct = function (args) { createArrayDescriptor('Write', 'STRUCT', args); };

        this.readArrayOfBool = function (args) { createArrayDescriptor('Read', 'BOOL', args); };
        this.readArrayOfByte = function (args) { createArrayDescriptor('Read', 'BYTE', args); };
        this.readArrayOfUsint = function (args) { createArrayDescriptor('Read', 'USINT', args); };
        this.readArrayOfSint = function (args) { createArrayDescriptor('Read', 'SINT', args); };
        this.readArrayOfWord = function (args) { createArrayDescriptor('Read', 'WORD', args); };
        this.readArrayOfUint = function (args) { createArrayDescriptor('Read', 'UINT', args); };
        this.readArrayOfInt = function (args) { createArrayDescriptor('Read', 'INT', args); };
        this.readArrayOfInt1Dp = function (args) { createArrayDescriptor('Read', 'INT1DP', args); };
        this.readArrayOfInt2Dp = function (args) { createArrayDescriptor('Read', 'INT2DP', args); };
        this.readArrayOfDword = function (args) { createArrayDescriptor('Read', 'DWORD', args); };
        this.readArrayOfUdint = function (args) { createArrayDescriptor('Read', 'UDINT', args); };
        this.readArrayOfDint = function (args) { createArrayDescriptor('Read', 'DINT', args); };
        this.readArrayOfReal = function (args) { createArrayDescriptor('Read', 'REAL', args); };
        this.readArrayOfLreal = function (args) { createArrayDescriptor('Read', 'LREAL', args); };
        this.readArrayOfString = function (args) { createArrayDescriptor('Read', 'STRING', args); };
        this.readArrayOfTime = function (args) { createArrayDescriptor('Read', 'TIME', args); };
        this.readArrayOfTod = function (args) { createArrayDescriptor('Read', 'TOD', args); };
        this.readArrayOfDate = function (args) { createArrayDescriptor('Read', 'DATE', args); };
        this.readArrayOfDt = function (args) { createArrayDescriptor('Read', 'DT', args); };
        this.readArrayOfStruct = function (args) { createArrayDescriptor('Read', 'STRUCT', args); };
        


        //======================================================================================
        //                   Methods for Creating the Symbol Table from Upload
        //                                 or the TPY File
        //======================================================================================   

        /**
         *  Get the upload info. 
         */

        function getUploadInfo() {
            //Generate the ADS request object and call the send function.
            var adsReq = {
                method: 'Read',
                indexGroup: indexGroups.UploadInfo,
                indexOffset: 0,
                reqDescr: {
                    readLength: 8
                    //sync: false
                }
            };
            createRequest(adsReq).send();
        }


        /**
         * Parse the upload information and call the request for 
         * reading the upload data.
         * 
         * @param {Object} adsReq   An ADS Request Descriptor.
         */
        function parseUploadInfo(adsReq) {
            var response, dataString, dataSubString, data, adsReq2;

            try {
                response = adsReq.xmlHttpReq.responseXML.documentElement;
                dataString = decodeBase64(response.getElementsByTagName('ppData')[0].firstChild.data);
                dataSubString = dataString.substr(0, 4);
                symbolCount = subStringToData(dataSubString, 'DWORD');
                dataSubString = dataString.substr(4, 4);
                uploadLength = subStringToData(dataSubString, 'DWORD');
            } catch (e) {
                log('TAME library error: Parsing of UploadInfo failed:' + e);
                return;
            }

            adsReq2 = {
                method: 'Read',
                indexGroup: indexGroups.Upload,
                indexOffset: 0,
                reqDescr: {
                    readLength: uploadLength
                    //sync: false
                }
            };
            createRequest(adsReq2).send();
        }


        /**
         * Parse the upload data and an object (symTable) with the symbol names 
         * as the properties. 
         * 
         * @param {Object} adsReq   An ADS Request Descriptor.
         */
        function parseUpload(adsReq) {
            var response,
                strAddr = 0,
                igOffs = 4,
                ioOffs = 8,
                sizeOffs = 12,
                nameOffs = 30,
                dataString, dataSubString, data, cnt, infoLen, nameAndType, typeArr, arrayLength, type, elem;

            try {
                response = adsReq.xmlHttpReq.responseXML.documentElement;
                dataString = decodeBase64(response.getElementsByTagName('ppData')[0].firstChild.data);

                for (cnt = 0; cnt < symbolCount; cnt++) {
                    //Get the length of the symbol information.
                    dataSubString = dataString.substr(strAddr, 4);
                    infoLen = subStringToData(dataSubString, 'DWORD');

                    //Get name and type.
                    nameAndType = dataString.substring(strAddr + nameOffs, (strAddr + infoLen)).split(String.fromCharCode(0));
                    name = nameAndType[0].toUpperCase();


                    //Create an entry.
                    symTable[name] = {
                        typeString: nameAndType[1],
                        indexGroup: subStringToData(dataString.substr(strAddr + igOffs, 4), 'DWORD'),
                        indexOffset: subStringToData(dataString.substr(strAddr + ioOffs, 4), 'DWORD'),
                        size: subStringToData(dataString.substr(strAddr + sizeOffs, 4), 'DWORD')
                    };

                    //Set additional information.
                    typeArr = nameAndType[1].split(" ");

                    if (typeArr[0] === 'ARRAY') {

                        //Type
                        symTable[name].type = typeArr[0];

                        //Array Length
                        arrayLength = typeArr[1].substring(1, typeArr[1].length - 1);
                        arrayLength = arrayLength.split('..');
                        symTable[name].arrStartIdx = parseInt(arrayLength[0], 10);
                        arrayLength = parseInt(arrayLength[1], 10) - parseInt(arrayLength[0], 10) + 1;
                        symTable[name].arrayLength = arrayLength;


                        //Data type of the array.
                        type = typeArr[3].split('(');
                        if (type[1] !== undefined) {
                            type[1] = type[1].substr(0, type[1].length - 1);
                            symTable[name].fullType = typeArr[0] + '.' + arrayLength + '.' + type[0] + '.' + type[1];
                            symTable[name].stringLength = parseInt(type[1], 10);
                        } else {
                            symTable[name].fullType = typeArr[0] + '.' + arrayLength + '.' + type[0];
                        }

                        //Item length
                        symTable[name].itemSize = symTable[name].size / arrayLength;

                        //Check if variable is a user defined data type,
                        symTable[name].arrayDataType = 'USER';
                        for (elem in plcTypeLen) {
                            if (plcTypeLen.hasOwnProperty(elem)) {
                                if (type[0] === elem) {
                                    symTable[name].arrayDataType = type[0];
                                }
                            }
                        }
                        if (symTable[name].arrayDataType === 'USER') {
                            symTable[name].dataType = type[0];
                        }

                    } else {
                        type = typeArr[0].split('(');

                        if (type[1] !== undefined) {
                            //String
                            type[1] = type[1].substr(0, type[1].length - 1);
                            symTable[name].fullType = type[0] + '.' + type[1];
                            symTable[name].stringLength = parseInt(type[1], 10);
                        } else {
                            symTable[name].fullType = type[0];
                        }

                        //Check if variable is a user defined data type,
                        symTable[name].type = 'USER';
                        for (elem in plcTypeLen) {
                            if (plcTypeLen.hasOwnProperty(elem)) {
                                if (type[0] === elem) {
                                    symTable[name].type = type[0];
                                }
                            }
                        }
                        if (symTable[name].type === 'USER') {
                            symTable[name].dataType = type[0];
                        }
                    }

                    strAddr += infoLen;
                }
                instance.symTableReady = true;

                log('TAME library info: End of fetching the symbols.');
                log('TAME library info: Symbol table ready.');

                if (service.syncXmlHttp !== true) {
                    onReady();
                }

            } catch (e) {
                log('TAME library error: Parsing of uploaded symbol information failed:' + e);
                return;
            }
        }


        /**
        * Get the symbol-file (*.tpy) from the server and create
        * an object (symTable) with the symbol names as the properties. 
        */
        function getConfigFile() {

            var xmlHttpReq = createXMLHttpReq(),
                symbolArray = [],
                configFile, name, allSymbols, typeArr, arrayLength, type, elem,
                tcVersion;

            log('TAME library info: Start reading the TPY file.');

            //HTTPRequest
            xmlHttpReq.open('GET', service.configFileUrl, !service.syncXmlHttp, service.serviceUser, service.servicePassword);
            xmlHttpReq.setRequestHeader('Content-Type', 'text/xml');

            xmlHttpReq.onreadystatechange = function () {

                if ((xmlHttpReq.readyState === 4) && (xmlHttpReq.status === 200)) {

                    //Create a DOM object from XML
                    if (typeof DOMParser != 'undefined') {
                        try {
                            configFile = (new DOMParser()).parseFromString(xmlHttpReq.responseText, "text/xml");
                        } catch (e) {
                            log('TAME library error: Creating a DOM object from TPY failed:' + e);
                            return;
                        }
                    } else {
                        log('TAME library error: Can\'t parse the symbol file cause your browser does not provide a DOMParser function.');
                    }


                    //Get the information about the PLC and the routing
                    if (typeof service.amsNetId !== 'string' || typeof service.amsPort !== 'string' || alignment === 0) {
                        log('TAME library info: Start reading the service information from the TPY file.');
                        try {
                            serviceInfo = {
                                netId: configFile.getElementsByTagName('NetId')[0].childNodes[0].nodeValue,
                                port: configFile.getElementsByTagName('Port')[0].childNodes[0].nodeValue
                            };

                            tcVersion = configFile.getElementsByTagName('TwinCATVersion')[0].childNodes[0].nodeValue.charAt(0);

                            if (tcVersion === '2') {
                                serviceInfo.alignment = parseInt(configFile.getElementsByTagName('PackSize')[0].childNodes[0].nodeValue, 10);
                            } else if (tcVersion === '3') {
                                serviceInfo.alignment = 8;
                            } else {
                                log('TAME library error: Could not determine the TwinCAT version.');
                            }
                            log('TAME library info: End of reading the service information from the TPY file.');
                        } catch (e) {
                            log('TAME library error: An error occured while reading service information from the TPY file:');
                            log(e);
                        }
                    } else {
                        log('TAME library info: NetId, port and alignment manually set. Skip reading the service information from the TPY file.');
                    }


                    //Create the symbol table
                    if (service.forceUploadUsage !== true) {
                        log('TAME library info: Start reading the symbols from the TPY file.');
                        try {
                            //Create an Array of the Elements with "Symbol" as tag name.
                            allSymbols = configFile.getElementsByTagName('Symbols')[0];
                            symbolArray = allSymbols.getElementsByTagName('Symbol');

                            //Get the name of the symbol and create an object property with it.
                            //symTable is declared outside in the constructor function.
                            for (var i = 0; i < symbolArray.length; i++) {
                                name = symbolArray[i].getElementsByTagName('Name')[0].childNodes[0].nodeValue.toUpperCase();
                                symTable[name] = {
                                    typeString: symbolArray[i].getElementsByTagName('Type')[0].childNodes[0].nodeValue.toUpperCase(),
                                    indexGroup: parseInt(symbolArray[i].getElementsByTagName('IGroup')[0].childNodes[0].nodeValue, 10),
                                    indexOffset: parseInt(symbolArray[i].getElementsByTagName('IOffset')[0].childNodes[0].nodeValue, 10),
                                    bitSize: parseInt(symbolArray[i].getElementsByTagName('BitSize')[0].childNodes[0].nodeValue, 10)
                                };
                                symTable[name].size = (symTable[name].bitSize >= 8) ? symTable[name].bitSize / 8 : symTable[name].bitSize;


                                //Set additional information.
                                typeArr = symTable[name].typeString.split(" ");

                                if (typeArr[0] === 'ARRAY') {

                                    //Type
                                    symTable[name].type = typeArr[0];

                                    //Array length
                                    arrayLength = typeArr[1].substring(1, typeArr[1].length - 1);
                                    arrayLength = arrayLength.split('..');
                                    symTable[name].arrStartIdx = parseInt(arrayLength[0], 10);
                                    arrayLength = parseInt(arrayLength[1], 10) - parseInt(arrayLength[0], 10) + 1;
                                    symTable[name].arrayLength = arrayLength;



                                    //Data type of the array.
                                    type = typeArr[3].split('(');
                                    if (type[1] !== undefined) {
                                        type[1] = type[1].substr(0, type[1].length - 1);
                                        symTable[name].fullType = typeArr[0] + '.' + arrayLength + '.' + type[0] + '.' + type[1];
                                        symTable[name].stringLength = parseInt(type[1], 10);
                                    } else {
                                        symTable[name].fullType = typeArr[0] + '.' + arrayLength + '.' + type[0];
                                    }

                                    //Item length
                                    symTable[name].itemSize = symTable[name].size / arrayLength;

                                    //Check if variable is a user defined data type,
                                    symTable[name].arrayDataType = 'USER';
                                    for (elem in plcTypeLen) {
                                        if (plcTypeLen.hasOwnProperty(elem)) {
                                            if (type[0] === elem) {
                                                symTable[name].arrayDataType = type[0];
                                            }
                                        }
                                    }
                                    if (symTable[name].arrayDataType === 'USER') {
                                        symTable[name].dataType = type[0];
                                    }

                                } else {
                                    type = typeArr[0].split('(');

                                    if (type[1] !== undefined) {
                                        //String
                                        type[1] = type[1].substr(0, type[1].length - 1);
                                        symTable[name].fullType = type[0] + '.' + type[1];
                                        symTable[name].stringLength = parseInt(type[1], 10);
                                    } else {
                                        symTable[name].fullType = type[0];
                                    }

                                    //Check if variable is a user defined data type,
                                    symTable[name].type = 'USER';
                                    for (elem in plcTypeLen) {
                                        if (plcTypeLen.hasOwnProperty(elem)) {
                                            if (type[0] === elem) {
                                                symTable[name].type = type[0];
                                            }
                                        }
                                    }
                                    if (symTable[name].type === 'USER') {
                                        symTable[name].dataType = type[0];
                                    }
                                }
                            }

                            instance.symTableReady = true;

                            log('TAME library info: End of reading the symbols from the TPY file.');
                            log('TAME library info: Symbol table ready.');

                        } catch (e) {
                            log('TAME library error: An error occured while parsing the symbol file:');
                            log(e);
                        }
                    } else {
                        log('TAME library info: Reading the symbols from the TPY file is deactivated.');
                    }


                    //Get the data types.
                    var allDataTypes, dataTypeArray, subItemArray, sName, fullName;

                    if (true) {
                        log('TAME library info: Start reading the data types from the TPY file.');
                        try {
                            //Create an Array of the Elements with "DataType" as tag name.
                            allDataTypes = configFile.getElementsByTagName('DataTypes')[0];
                            dataTypeArray = allDataTypes.getElementsByTagName('DataType');

                            //Get the name of the data type and create an object property with it.
                            //dataTypeTable is declared outside in the constructor function.
                            //Arrays first
                            for (var i = 0; i < dataTypeArray.length; i++) {
                                fullName = dataTypeArray[i].getElementsByTagName('Name')[0].childNodes[0].nodeValue.toUpperCase();
                                name = fullName.split(" ")[0];
                                if (name === 'ARRAY') {

                                    dataTypeTable[fullName] = {
                                        //type: dataTypeArray[i].getElementsByTagName('Type')[0].childNodes[0].nodeValue.toUpperCase(),
                                        bitSize: parseInt(dataTypeArray[i].getElementsByTagName('BitSize')[0].childNodes[0].nodeValue, 10)
                                    };
                                    dataTypeTable[fullName].size = dataTypeTable[fullName].bitSize / 8;
                                }
                            }
                            //Then the rest
                            for (var i = 0; i < dataTypeArray.length; i++) {
                                fullName = dataTypeArray[i].getElementsByTagName('Name')[0].childNodes[0].nodeValue.toUpperCase();
                                name = fullName.split(" ")[0];
                                if (name !== 'ARRAY') {

                                    dataTypeTable[name] = {
                                        //type: dataTypeArray[i].getElementsByTagName('Type')[0].childNodes[0].nodeValue.toUpperCase(),
                                        bitSize: parseInt(dataTypeArray[i].getElementsByTagName('BitSize')[0].childNodes[0].nodeValue, 10),
                                        subItems: {}
                                    };
                                    dataTypeTable[name].size = dataTypeTable[name].bitSize / 8;

                                    //Get the SubItems
                                    subItemArray = dataTypeArray[i].getElementsByTagName('SubItem');

                                    for (var j = 0; j < subItemArray.length; j++) {
                                        sName = subItemArray[j].getElementsByTagName('Name')[0].childNodes[0].nodeValue.toUpperCase();
                                        //Only SubItems with type information (problem occurs with TC3 and some libs)
                                        if (subItemArray[j].getElementsByTagName('Type').length > 0) {

                                            //sName = subItemArray[j].getElementsByTagName('Name')[0].childNodes[0].nodeValue.toUpperCase();
                                            dataTypeTable[name].subItems[sName] = {
                                                typeString: subItemArray[j].getElementsByTagName('Type')[0].childNodes[0].nodeValue.toUpperCase(),
                                                pointer: subItemArray[j].getElementsByTagName('Type')[0].hasAttribute('Pointer'),
                                                bitSize: parseInt(subItemArray[j].getElementsByTagName('BitSize')[0].childNodes[0].nodeValue, 10)
                                            };
                                            if (subItemArray[j].getElementsByTagName('BitOffs')[0] !== undefined) {
                                                dataTypeTable[name].subItems[sName].bitOffset = parseInt(subItemArray[j].getElementsByTagName('BitOffs')[0].childNodes[0].nodeValue, 10);
                                            }


                                            dataTypeTable[name].subItems[sName].size = (dataTypeTable[name].subItems[sName].bitSize >= 8) ? dataTypeTable[name].subItems[sName].bitSize / 8 : dataTypeTable[name].subItems[sName].bitSize;

                                            //Set additional information
                                            typeArr = dataTypeTable[name].subItems[sName].typeString.split(" ");

                                            if (typeArr[0] === 'ARRAY') {

                                                //Type
                                                dataTypeTable[name].subItems[sName].type = typeArr[0];

                                                //Array Length
                                                arrayLength = typeArr[1].substring(1, typeArr[1].length - 1);
                                                arrayLength = arrayLength.split('..');
                                                dataTypeTable[name].subItems[sName].arrStartIdx = parseInt(arrayLength[0], 10);
                                                arrayLength = parseInt(arrayLength[1], 10) - parseInt(arrayLength[0], 10) + 1;
                                                dataTypeTable[name].subItems[sName].arrayLength = arrayLength;


                                                //Data type of the array.
                                                type = typeArr[3].split('(');
                                                if (type[1] !== undefined) {
                                                    type[1] = type[1].substr(0, type[1].length - 1);
                                                    dataTypeTable[name].subItems[sName].fullType = typeArr[0] + '.' + arrayLength + '.' + type[0] + '.' + type[1];
                                                    dataTypeTable[name].subItems[sName].stringLength = parseInt(type[1], 10);
                                                } else {
                                                    dataTypeTable[name].subItems[sName].fullType = typeArr[0] + '.' + arrayLength + '.' + type[0];
                                                }

                                                //Check added cause there are undefined data types some TwinCAT libs                                         
                                                if (service.skipMissingTypes === true && dataTypeTable[dataTypeTable[name].subItems[sName].typeString] === undefined) {
                                                    log('TAME library error: Data type missing in TPY file:');
                                                    log(dataTypeTable[name].subItems[sName]);
                                                    log('TAME library warning: Access to symbols using this data type will return wrong results:');
                                                    log(name);
                                                    log('TAME library info: Use handles to access symbols using this data type.');
                                                } else {
                                                    if (dataTypeTable[dataTypeTable[name].subItems[sName].typeString] === undefined) {
                                                        log('TAME library error: Data type missing in TPY file!');
                                                        log('TAME library info: If you don\'t use this data type you can set the client parameter "skipMissingTypes" to true.');
                                                    }
                                                    dataTypeTable[name].subItems[sName].bitSize = dataTypeTable[dataTypeTable[name].subItems[sName].typeString].bitSize;
                                                    dataTypeTable[name].subItems[sName].size = dataTypeTable[dataTypeTable[name].subItems[sName].typeString].size;
                                                }


                                                //Item length
                                                dataTypeTable[name].subItems[sName].itemSize = dataTypeTable[name].subItems[sName].size / arrayLength;

                                                //Check if variable is a user defined data type,
                                                dataTypeTable[name].subItems[sName].arrayDataType = 'USER';
                                                for (elem in plcTypeLen) {
                                                    if (plcTypeLen.hasOwnProperty(elem)) {
                                                        if (type[0] === elem) {
                                                            dataTypeTable[name].subItems[sName].arrayDataType = type[0];
                                                        }
                                                    }
                                                }
                                                if (dataTypeTable[name].subItems[sName].arrayDataType === 'USER') {
                                                    dataTypeTable[name].subItems[sName].dataType = type[0];
                                                }

                                            } else {
                                                type = typeArr[0].split('(');

                                                if (type[1] !== undefined) {
                                                    //String
                                                    type[1] = type[1].substr(0, type[1].length - 1);
                                                    dataTypeTable[name].subItems[sName].fullType = type[0] + '.' + type[1];
                                                    dataTypeTable[name].subItems[sName].stringLength = parseInt(type[1], 10);
                                                } else {
                                                    dataTypeTable[name].subItems[sName].fullType = type[0];
                                                }

                                                //Check if variable is a user defined data type,
                                                dataTypeTable[name].subItems[sName].type = 'USER';
                                                for (elem in plcTypeLen) {
                                                    if (plcTypeLen.hasOwnProperty(elem)) {
                                                        if (type[0] === elem) {
                                                            dataTypeTable[name].subItems[sName].type = type[0];
                                                        }
                                                    }
                                                }
                                                if (dataTypeTable[name].subItems[sName].type === 'USER') {
                                                    dataTypeTable[name].subItems[sName].dataType = type[0];
                                                }
                                            }
                                        } else {
                                            log('TAME library warning: Skipping SubItem with no type information: Data type: ' + name + ' ,SubItem: ' + sName);
                                        }
                                    }
                                }

                            }
                            instance.dataTypeTableReady = true;

                            log('TAME library info: End of reading the data types from the TPY file.');
                            log('TAME library info: Data type table ready.');

                            //Get Upload Info
                            checkGetUploadInfo();

                        } catch (e) {
                            log('TAME library error: An error occured while creating the data type information:');
                            log('Type: ' + fullName);
                            log('SubItem: ' + sName);
                            log(e);
                        }
                    }
                }
            };

            xmlHttpReq.send(null);

        };


        /**
         *  Set the service parameter with the values read from the TPY file.
         */
        function setServiceParamFromTPY() {
            if (typeof service.amsNetId !== 'string') {
                service.amsNetId = serviceInfo.netId;
                log('TAME library info: No NetId definition found. NetId from TPY file will be used.');
            }

            if (typeof service.amsPort !== 'string') {
                service.amsPort = serviceInfo.port;
                log('TAME library info: No AMS port definition found. Port number from TPY file will be used.');
            }

            if (alignment === 0) {
                if (serviceInfo.alignment !== undefined) {
                    alignment = serviceInfo.alignment;
                    log('TAME library info: No alignment parameter found. Alignment from TPY file will be used.');
                } else {
                    alignment = 1;
                    log('TAME library warning: Can\'t get a value for the data aligment. Default value for alignment is used (1). This works only with TC2 and x86 processors.');
                }
            }

            if (alignment !== 1 && alignment !== 4 && alignment !== 8) {
                log('TAME library warning: The value for the alignment should be 1, 4 or 8.');
            }

            log('TAME library info: Target information: NetId: ' + service.amsNetId + ', AMS port: ' + service.amsPort + ' , alignment: ' + alignment);
        };


        /**
         * Check if the UploadInfo has to be fetched.
         */
        function checkGetUploadInfo() {

            setServiceParamFromTPY();

            if (typeof service.configFileUrl != 'string' || service.forceUploadUsage === true) {
                log('TAME library info: Start fetching the symbols from PLC.');
                //Get the UploadInfo.
                try {
                    getUploadInfo();
                } catch (e) {
                    log('TAME library error: Could\'nt fetch the symbol information from the PLC:' + e);
                    return;
                }
            } else {
                if (service.syncXmlHttp !== true) {
                    onReady();
                }
            }
        }

        /**
         * Call the onReady function.
         */
        function onReady() {
            //On-ready-function
            if (typeof service.onReady === 'function') {
                log('TAME library info: Calling the "onReady" function.');
                service.onReady();
            } else {
                log('TAME library error: No "onReady" function defined. Check the manual.');
            }
            //Start cyclic ADS checks if defined
            if (!isNaN(service.adsCheckInterval) && service.adsCheckInterval >= 1) {
                log('TAME library info: Start cyclic reading of ADS state.');
                setInterval(instance.readAdsState, service.adsCheckInterval);
            }
        }


        /**
         * !!!!!INITIALIZATION OF THE SYMBOL TABLE!!!!!
         * !!!!!This function is called with instancing of the client.!!!!!
         * 
         * Get the names of the PLC variables using the upload info.
         */
        if (service.dontFetchSymbols === true) {
            log('TAME library warning: Reading of the UploadInfo and the TPY file deactivated. Symbol Table could not be created.');

            if (alignment !== 1 && alignment !== 4 && alignment !== 8) {
                log('TAME library warning: The value for the alignment should be 1, 4 or 8.');
            }

            log('TAME library info: Target information: NetId: ' + service.amsNetId + ', AMS port: ' + service.amsPort + ' , alignment: ' + alignment);

            if (service.syncXmlHttp !== true) {
                window.setTimeout(onReady, 1);
            }

        } else {
            if (typeof service.configFileUrl == 'string') {
                log('TAME library info: Fetching the TPY file from the webserver.');
                //Get the symbol file and parse it. Upload Info will be fetched after.
                getConfigFile();
            } else {
                //Start getting the Upload Info.
                checkGetUploadInfo();
            }
        }

    };


    /**
     * Function for creating the Webservice Client.
     * 
     * @param {Object} service  Contains the paramters of the webservice.
     * @return {Object}         An instance of the Webservice Client.
     * 
     */
    TAME.WebServiceClient.createClient = function (service) {
        "use strict";
        return new TAME.WebServiceClient(service);
    };



    /**
     * Check if we are in a browser or in Node.
     */
    if (typeof exports == 'undefined') {
        window.TAME = TAME;
    } else {
        module.exports = TAME;
    };

})();


