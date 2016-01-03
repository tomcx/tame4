/**
 *  @author T.Schmidt, 02.01.2016
 *  Example using arrays with TAME 4.
 */

//A global variable as namespace
var Demo = {
    stringArrayIn: [],
    stringArrayOut: [],
    boolArrayIn: [],
    boolArrayOut: []
};
            

//Function for starting the client. Defined in "webservice.js"
//in the "resources" directory. 
window.onload = startClient;


//This function is called if client is ready (on-ready-function).
//See "webservice.js" in the "resources" directory. 
function loadExample() {
    
    /*
     * Array of STRING
     */

    //Button for sending values to the PLC, can be a local variable.
    //50ms after writing the function for reading is called.
    var button1 = document.getElementById("button1");

    button1.onclick = function(){
        for (var i = 0; i < 5; i++) {
            Demo.stringArrayOut[i] = document.getElementById("inputstring" + i).value;
        }
        var item = parseInt((document.getElementById("stringIdx").value), 10);
        Plc.writeArrayOfString({
            name: '.ArrayOfString',
            val: Demo.stringArrayOut,
            item: item,
            oc: Demo.readStringArray,
            ocd: 50
        });
    };

    Demo.readStringArray = function(){
        Plc.readArrayOfString({
            name: '.ArrayOfString',
            jvar: 'Demo.stringArrayIn',
            oc: function() {
                 for (var i = 0; i < 5; i++) {
                    document.getElementById("showstring" + i).firstChild.data = Demo.stringArrayIn[i];
                }
            }
        });
    };
    
    
    /*
     * Array of BOOL
     */
    
    var button2 = document.getElementById("button2");

    button2.onclick = function(){
        for (var i = 0; i < 5; i++) {
            Demo.boolArrayOut[i] = document.getElementById("inputbool" + i).checked;
        }
        var item2 = parseInt((document.getElementById("boolIdx").value), 10);
        Plc.writeArrayOfBool({
            name: '.ArrayOfBool',
            val: Demo.boolArrayOut,
            item: item2,
            oc: Demo.readBoolArray,
            ocd: 50
        });
    };

    Demo.readBoolArray = function(){
        Plc.readArrayOfBool({
            name: '.ArrayOfBool',
            jvar: 'Demo.boolArrayIn',
            oc: function() {
                 for (var i = 0; i < 5; i++) {
                    document.getElementById("showbool" + i).firstChild.data = Demo.boolArrayIn[i];
                }
            }
        });
    };
    
};


