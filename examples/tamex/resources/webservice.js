/**
 * @author T. Schmidt, 04.01.2016
 */

//Webservice definition for all examples
var Plc;

function startClient(handles) {
    Plc =  TAME.WebServiceClient.createClient({
        serviceUrl: 'http://192.168.1.2/TcAdsWebService/TcAdsWebService.dll',
        //configFileUrl: 'http://192.168.1.2/tamex/resources/demo2.tpy',  //Path to the TPY file
        amsNetId: '192.168.1.2.1.1',
        //amsPort: '801',       //default
        useHandles: handles,    //use handles
        //alignment: '1',       //default, set it to "4" if you have TC2 and an ARM based PLC device (i.e. CX90xx), to 8 with TC3
        //language: 'ge',       //default, set it to "en" for english names of days and months
        onReady: loadExample    //this function is defined in each example
    });
}

