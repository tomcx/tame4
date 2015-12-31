/**
 *  @author T.Schmidt, 14.06.2012
 *  Last change 27.03.2015
 *  Very basic example using TAME 3.
 */

//Global variables
var field1, field2, field5, field6, field7, field8, field9, 
    field10, field11, field12, field13, field20, field21,
    counter1, counter2, pollZyk1, runLight = [];

window.onload = function() {
  
    //Output fields, must be defined global.
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
    //just for showing how to use them with a on-complete-function.
    var pollWert1 = function() {
        Plc.readBool({name: '.In_Bool1', jvar: 'field1.data'});
    };
    var pollWert2 = function() {
        Plc.readBool({name: '.In_Bool2', jvar: 'field2.data'});
    };
    
    
    //2 Buttons, 50ms after writing the data the function for reading the values is called
    //oc = on-complete, ocd = on-complete-delay (in ms)
    document.getElementById('button1').onclick = function() {
        var wert = document.getElementById('checkbox1').checked;
        Plc.writeBool({name: '.IN_BOOL1', val: wert, oc: pollWert1, ocd: 50});
    };
    document.getElementById('button2').onclick = function() {
        var wert = document.getElementById('checkbox2').checked;
        Plc.writeBool({name: '.In_Bool2', val: wert, oc: pollWert2, ocd: 50});
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
    pollZyk1 = function(){
        
        var i;
        
        Plc.sumReadReq({
            id: 1,        //If an ID is given, the script waits for the end of the request before firing a new one.
            items: [
                {
                    name: 'MAIN.Ramp1',
                    jvar: 'counter1.data'
                },{
                    name: 'MAIN.Ramp2',
                    jvar: 'counter2.data'
                },{
                    name: 'MAIN.RunningLight1',
                    jvar: 'runLight[0]'
                },{
                    name: 'MAIN.RunningLight2',
                    jvar: 'runLight[1]'
                },{
                    name: 'MAIN.RunningLight3',
                    jvar: 'runLight[2]'
                },{
                    name: 'MAIN.RunningLight4',
                    jvar: 'runLight[3]'
                },{
                    name: 'MAIN.RunningLight5',
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
                },/*{
                    name: '.DATE_Test',
                    jvar: 'field12.data'
                },*/{
                    name: '.In_REAL',
                    jvar: 'field13.data',
                    dp: 2
                },{
                    name: '.In_REAL',
                    jvar: 'field21.data'
                }
            ],
            oc: function() {
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
        
        window.setTimeout('pollZyk1()', 100); //Timeout 100 ms
    };

    
    /*
     *  Start
     */    
    pollZyk1();
    pollWert1();
    pollWert2();

};

