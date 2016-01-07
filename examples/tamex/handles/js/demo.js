/**
 *  @author T.Schmidt, 07.01.2016
 *  Example using handles.
 */


//Global variables
var field1, field2, field5, field6, field7, field8, field9, 
    field10, field11, field12, field13, field20, field21,
    counter1, counter2, pollCycl, runLight = [];


//Function for starting the client. Defined in "webservice.js"
//in the "resources" directory. Of course you can use "window.onload"
//as in the other examples. 
window.addEventListener("load", function (event) {
    startClient(true);
});

//Release handles before leaving the page
window.addEventListener("beforeunload", function (event) {
    Plc.releaseHandles();
    //event.returnValue = 'Handles released.'; 
});


//This function is called if client is ready (on-ready-function).
//See "webservice.js" in the "resources" directory. 
function loadExample() {
    //Get the handles from the PLC and start the example after.
    Plc.getHandles({
        symbols: [
            '.In_Bool1',
            '.In_Bool2',
            '.IN_SINT1',
            '.IN_INT1',
            '.IN_DINT',
            '.IN_STRING',
            '.IN_TIME',
            '.IN_REAL',
            '.TOD_TEST',
            '.DT_TEST',
            '.DATE_TEST',
            'MAIN.fbRamp1.nRamp',
            'MAIN.fbRamp2.nRamp',
            'MAIN.fbRunningLight.bQ1',
            'MAIN.fbRunningLight.bQ2',
            'MAIN.fbRunningLight.bQ3',
            'MAIN.fbRunningLight.bQ4',
            'MAIN.fbRunningLight.bQ5',
        ],
        oc: loadExampleStep2
    });
}


//This function is called if client is ready (on-ready-function).
//See "webservice.js" in the "resources" directory. 
function loadExampleStep2() {
  
    //Output fields.
    field1 = document.getElementById('field1').firstChild;
    field2 = document.getElementById('field2').firstChild;
    field5 = document.getElementById('field5').firstChild;
    field6 = document.getElementById('field6').firstChild;
    field7 = document.getElementById('field7').firstChild;
    field8 = document.getElementById('field8').firstChild;
    field9 = document.getElementById('field9').firstChild;
    field10 = document.getElementById('field10').firstChild;
    field11 = document.getElementById('field11').firstChild;
    field12 = document.getElementById('field12').firstChild;
    field13 = document.getElementById('field13').firstChild;
    field20 = document.getElementById('field20').firstChild;
    field21 = document.getElementById('field21').firstChild;
    
    
    /*
     *  Examples for reading/writing on button click.
     */

    //Functions for reading data not included in the cyclic polling
    //just for showing how to use them with an on-complete-function.
    var pollValue1 = function() {
        Plc.readBool({name: '.In_Bool1', jvar: 'field1.data'});
    };
    var pollValue2 = function() {
        Plc.readBool({name: '.In_Bool2', jvar: 'field2.data'});
    };
    
    
    //2 Buttons, 50ms after writing the data the function for reading the values is called
    //oc = on-complete, ocd = on-complete-delay (in ms)
    document.getElementById('button1').onclick = function() {
        var wert = document.getElementById('checkbox1').checked;
        Plc.writeBool({name: '.IN_BOOL1', val: wert, oc: pollValue1, ocd: 50});
    };
    document.getElementById('button2').onclick = function() {
        var wert = document.getElementById('checkbox2').checked;
        Plc.writeBool({name: '.In_Bool2', val: wert, oc: pollValue2, ocd: 50});
    };
    
    
    
    //Buttons for writing values, the reading is done by the SumReadRequest
    document.getElementById('button5').onclick = function() {
        var wert = document.getElementById('input1').value;
        Plc.writeSint({name: '.IN_SINT1', val: wert});
    };
    document.getElementById('button6').onclick = function() {
        var wert = document.getElementById('input2').value;
        Plc.writeInt({name: '.In_INT1', val: wert});
    };
    document.getElementById('button7').onclick = function() {
        var wert = document.getElementById('input3').value;
        Plc.writeDint({name: '.In_DINT', val: wert});
    };
    document.getElementById('button8').onclick = function() {
        var wert = document.getElementById('input4').value;
        Plc.writeString({name: '.In_STRING', val: wert});
    };
    document.getElementById('button9').onclick = function() {
        var wert = document.getElementById('input5').value;
        Plc.writeTime({name: '.In_TIME', val: wert, format:'#m'});
    };
    document.getElementById('button10').onclick = function() {
        var wert = new Date(new Date());
        Plc.writeTod({name: '.TOD_Test', val: wert});
    };
    document.getElementById('button11').onclick = function() {
        var wert = new Date(new Date());
        Plc.writeDt({name: '.DT_Test', val: wert});
    };
    document.getElementById('button12').onclick = function() {
        var wert = new Date(new Date());
        Plc.writeDate({name: '.DATE_Test', val: wert});
    };
    document.getElementById('button13').onclick = function() {
        var wert = document.getElementById('input6').value;
        Plc.writeReal({name: '.In_REAL', val: wert});
    };
    
    
        
    /*
     *  Example for cyclic reading with the new SumReadRequest.
     *  For better performance always try to use only one fast cyclic request.
     * 
     */  
    counter1 = document.getElementById('ramp1').firstChild;
    counter2 = document.getElementById('ramp2').firstChild;
    

     
    //This function reads the data of the variables 
    //an calls itself again. Of course you can use "setInterval" instead.
    pollCycl = function(){
        
        var i;
        
        Plc.sumReadReq({
            id: 1,        //If an ID is given, the script waits for the end of the request before firing a new one.
            items: [
                {
                    name: 'MAIN.fbRamp1.nRamp',
                    type: 'INT',
                    jvar: 'counter1.data'
                },{
                    name: 'MAIN.fbRamp2.nRamp',
                    type: 'INT',
                    jvar: 'counter2.data'
                },{
                    name: 'MAIN.fbRunningLight.bQ1',
                    type: 'BOOL',
                    jvar: 'runLight[0]'
                },{
                    name: 'MAIN.fbRunningLight.bQ2',
                    type: 'BOOL',
                    jvar: 'runLight[1]'
                },{
                    name: 'MAIN.fbRunningLight.bQ3',
                    type: 'BOOL',
                    jvar: 'runLight[2]'
                },{
                    name: 'MAIN.fbRunningLight.bQ4',
                    type: 'BOOL',
                    jvar: 'runLight[3]'
                },{
                    name: 'MAIN.fbRunningLight.bQ5',
                    type: 'BOOL',
                    jvar: 'runLight[4]'
                },{
                    name: '.In_SINT1',
                    jvar: 'field5.data'
                },{
                    name: '.In_INT1',
                    jvar: 'field6.data'
                },{
                    name: '.In_DINT',
                    jvar: 'field7.data'
                },{
                    name: '.In_String',
                    jvar: 'field8.data'
                },{
                    name: '.In_TIME',
                    jvar: 'field9.data',
                    format:'#m'
                },{
                    name: '.TOD_Test',
                    jvar: 'field10.data',
                    format:'#hh#:#mm#:#ss#:#msmsms'
                },{
                    name: '.DT_Test',
                    jvar: 'field11.data',
                    format:'#DD#.#MM#.#YYYY#, #hh#:#mm#:#ss'
                },{
                    name: '.DT_Test',
                    jvar: 'field20.data'
                },{
                    name: '.DATE_Test',
                    jvar: 'field12.data',
                    format:'#WEEKDAY#, #DD#.#MM#.#YYYY'
                },{
                    name: '.In_REAL',
                    jvar: 'field13.data',
                    dp: 2
                },{
                    name: '.In_REAL',
                    jvar: 'field21.data'
                }
            ],
            oc: function() {
                //On-complete-function
                //Set the background-color after reading data
                for (i = 0; i < 5; i++) {
                    if (runLight[i] === true) {
                        document.getElementById('light' + i).style.backgroundColor = 'green';
                    } else {
                        document.getElementById('light' + i).style.backgroundColor = 'red';
                    }
                }
            }
        });
        
        //Call the function again
        window.setTimeout('pollCycl()', 100); //Timeout 100 ms
    };

    
    /*
     *  Start polling
     */    
    pollCycl();
    pollValue1();
    pollValue2();

};

