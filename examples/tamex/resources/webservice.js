/**
 * @author T. Schmidt
 */

//Webservice definition for all examples
var Plc =  TAME.WebServiceClient.createClient({
    serviceUrl: 'http://192.168.1.2/TcAdsWebService/TcAdsWebService.dll',
    amsNetId: '192.168.1.2.1.1',
    amsPort: '801',     //default
    //alignment: '1',  //default, set it to "4" if you have TC2 and an ARM based PLC device (i.e. CX90xx), to 8 with TC3
    //language: 'ge'   //default, set it to "en" for english names of days and months
});

//For testing:
//Log the symbol table to the console.
Plc.logSymbols();
