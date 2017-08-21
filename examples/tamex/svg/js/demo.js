/**
 *  @author N.Linnemann, 14.07.2017
 *  SVG example using TAME 4.
 */


//Global variables
var boolArray = [];
var bfrontLight = false;
var bindicatorLight = false;
var rSpeed = 3.0;
var bfrontLightChange = '######';
var bfrontWindowChange = '######';
var bbackWindowChange = '######';
var bindicatorLightChange = '######';
var bWheelChange = '######';
var rSpeedChange = '######';

//Assign color and touch objects
frontLight = document.getElementById('frontLight');
brakeLight = document.getElementById('brakeLight');
indicatorLight = document.getElementById('indicatorLight');

//Assign animation objects
frontWheelAni = document.getElementById('frontWheelAni');
backWheelAni = document.getElementById('backWheelAni');
frontWindowAni = document.getElementById('frontWindowAni');
backWindowAni = document.getElementById('backWindowAni');

//Assign touch objects
frontWheel = document.getElementById('frontWheel');
backWheel = document.getElementById('backWheel');
frontWindow = document.getElementById('frontWindow');
backWindow = document.getElementById('backWindow');
carBody = document.getElementById('carBody');

//Function for starting the client. Defined in "webservice.js"
//in the "resources" directory. 
window.onload = startClient;


//This function is called if client is ready (on-ready-function).
//See "webservice.js" in the "resources" directory. 
function loadExample() {

    
    //This function reads the data of the variables 
    //an calls itself again. Of course you can use "setInterval" instead.
    pollCycl = function(){
        
        var i;
        
        Plc.sumReadReq({
            id: 1,        //If an ID is given, the script waits for the end of the request before firing a new one.
            items: [
                {
                    name: '.ArrayOfBool',
                    jvar: 'boolArray'
                },
                {
                    name: '.In_Bool1',
                    jvar: 'bfrontLight'
                },
                {
                    name: '.In_REAL',
                    jvar: 'rSpeed'
                },
                {
                    name: 'Main.RunningLight1',
                    jvar: 'bindicatorLight'
                },
            ],
            oc: function() {
                //On-complete-function

                // ----- Detect change ------ //
                if (bfrontLightChange !== bfrontLight) {
                    console.log("changed frontlight");
                    bfrontLightChange = bfrontLight;
                    changeColor(bfrontLight,frontLight,'afc6e9','ffcc00');       
                }
                
                // ----- Detect change ------ //
                if (bfrontWindowChange !== boolArray[0]) {
                    console.log("changed frontwindow");
                    bfrontWindowChange = boolArray[0];
                    turnOnOffMotion(bfrontWindowChange,frontWindowAni);       
                }
                
                // ----- Detect change ------ //
                if (bbackWindowChange !== boolArray[1]) {
                    console.log("changed backwindow");
                    bbackWindowChange = boolArray[1];
                    turnOnOffMotion(bbackWindowChange,backWindowAni);       
                }
                
                // ----- Detect change ------ //
                if (bindicatorLightChange !== bindicatorLight) {
                    console.log("changed indicatorlight");
                    bindicatorLightChange = bindicatorLight;
                    changeColor(bindicatorLight,indicatorLight,'ffff00','ff9955');  
                }
                
                // ----- Detect change ------ //
                if (bWheelChange !== boolArray[2]) {
                    console.log("changed Wheels");
                    bWheelChange = boolArray[2];
                    turnOnOff(boolArray[2],frontWheelAni);
                    turnOnOff(boolArray[2],backWheelAni);     
                }
                
                // ----- Detect change ------ //
                if (rSpeedChange !== rSpeed) {
                    console.log("speed changed to: " + rSpeed);
                    rSpeedChange = rSpeed;
                    changeAttr(rSpeed,frontWheelAni,"dur","s");
                    changeAttr(rSpeed,backWheelAni,"dur","s");   
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
    
    /*
    We import all the click functions when the first loop has been completed
    so all vars and arrays have been initialized
    */
    $.getScript('js/vex.tame.js');
};

/**
* Function to change fill color of an SVG object
* @param {val} bool - value of the attribute
* @param {obj} obj - the animation object to target
* @param {colorOn} str - color when val is true
* @param {colorOff} str - color when val is false
*/
function changeColor(val,obj,colorOn,colorOff){
    if (val === true) {
       obj.style.fill = colorOn;
    } else {
       obj.style.fill = colorOff;
    }
};

/**
* Function to start stop a linear path animation. Turning a bool false will reverse the animation
* @param {val} bool - value of the attribute
* @param {obj} obj - the animation object to target
*/
function turnOnOffMotion(val,obj){
    if (val === true) {
       obj.endElement();
       obj.setAttribute("keyPoints","0;1");
       obj.beginElement();
    } else {
       obj.endElement();
       obj.setAttribute("keyPoints","1;0");
       obj.beginElement();
    }
};


/**
* Function to start stop an animation
* @param {val} bool - value of the attribute
* @param {obj} obj - the animation object to target
*/
function turnOnOff(val,obj){
    if (val === true) {
       obj.beginElement();
    } else {
       obj.endElement();
    }
};

/**
* Function to change an animation or object attribute
* @param {val} str - value of the attribute
* @param {obj} obj - the animation object to target
* @param {attr} str - attribute to change
* @param {unit} str - if the attr has an extra unit eg. 2s then add this to the attr
*/
function changeAttr(val,obj,attr,unit){
    obj.setAttribute(attr,val+unit);
};



