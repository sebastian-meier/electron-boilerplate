var app = require('app'),
	Menu = require('menu'),
	dialog = require('dialog'),
	ElectronScreen,
	fs = require('fs'),
	//remote = require('remote'),
	BrowserWindow = require('browser-window');

//Variable that knows if the app is ready yet
var ready = false;

//Variable contains a path to a folder if "open-file" event is called before ready
var preready = false;

//Path to settings file
global.settings_path = app.getPath('userData') + '/settings.json';

//Main Window
var mainWindow = null;

//Secondary Window
var secondWindow = null;

//Error Window
var errorWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform != 'darwin') {
		app.quit();
	}
});

//Somebody acticates the app (usually via tabbing or clicking the app icon)
app.on('activate', function(event, path) {
	if(mainWindow === null){
		global.initApp();
	}
});


//Starting the presentation mode if somebody drops a valid folder onto the app icon
app.on('open-file', function(event, path) {
	//This event sometimes gets triggered before the ready event, so if app is not ready yet, initiate after ready
	if(ready){
		global.openFolder(path);
	}else{
		preready = path;
	}
});

//App initialization
app.on('ready', function() {
	//Load the settings
	//If settings file does not exist, create the settings file
	try {
		//WHERE SHOULD WE STORE THE SETTINGS? I guess on user level to support machines with multiple users?!
		//var settingsPath = app.getPath('appData') + '/settings.json';
		fs.openSync(global.settings_path, 'r+'); //throws error if file doesn't exist, continues after catch
		var data=fs.readFileSync(global.settings_path);
		global.settings = JSON.parse(data);
		global.error("Success, settings found:", global.settings);
	} catch (err) {
		//if error, then there was no settings file
		try {
			//create file if not exists
			var fd = fs.openSync(global.settings_path, 'w+');

			//empty settings
			global.settings = {
				"template_directory":null,
				"last_template":null
			};

			updateSettings();

		} catch (err) {
			global.error("Error creating settings file:", err);
			throw err;
		}
	}

	//initialize app
	initApp();

	if(preready !== false){
		openFolder(preready);
	}

});

global.updateSettings = function(){
	try {
		fs.writeFileSync(global.settings_path, JSON.stringify(global.settings) , 'utf-8');
		global.error("settings saved:",global.settings_path);
	} catch (err) {
		global.error("Error writing to settings file: " + err);
		throw err;
	}
};

var menuTemplate = [
	{
		label:'Edit',
		submenu: [
			{
				label:'Undo',
				accelerator: 'CmdOrCtr+Z',
				role: 'undo'
			},
			{
				label:'Redo',
				accelerator: 'Shift+CmdOrCtr+Z',
				role: 'redo'
			},
			{
				type: 'separator'
			},
			{
				label:'Cut',
				accelerator: 'CmdOrCtr+X',
				role: 'cut'
			},
			{
				label:'Copy',
				accelerator: 'CmdOrCtr+C',
				role: 'copy'
			},
			{
				label:'Pase',
				accelerator: 'CmdOrCtr+V',
				role: 'paste'
			},
			{
				label:'Select All',
				accelerator: 'CmdOrCtr+A',
				role: 'selectall'
			}
		]
	},{
		label: 'View',
		submenu:[
			{
				label: 'Toggle Full Screen',
				accelerator: (function(){
					if(process.platform == 'darwin'){
						return 'Ctrl+Command+F';
					}else{
						return 'F11';
					}
				})(),
				click: function(item, focusedWindow){
					//If you have multiple windows and you just want the focused window to become full screen use this...
					/*if(focusedWindow){
						focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
					}*/

					//If you want something like a presentation mode with two windows in fullscreen on each display use this...

					//For this to work on OS X you need to go to System Preferences > Spaces > Enable different spaces for external displays, otherwise you will get a black screen on the second display
					if(mainWindow){
						var state = true;
						if(mainWindow.isFullScreen()){
							state = false;
						}
						mainWindow.setFullScreen(state);
						if(secondWindow){
							//Make sure the note window is on the secondary display
							secondWindow.setFullScreen(state);
						}
					}
				}
			},
			{
				label: 'Toggle Developer Tools',
				accelerator: (function(){
					if(process.platform == 'darwin'){
						return 'Alt+Command+I';
					}else{
						return 'Ctrl+Shift+I';
					}
				})(),
				click: function(item, focusedWindow){
					if(focusedWindow){
						focusedWindow.toggleDevTools();
					}
				}
			}
		]
	},{
		label:'Window',
		role:'window',
		submenu:[
			{
				label:'Minimize',
				accelerator: 'CmdOrCtrl+M',
				role:'minimize'
			},
			{
				label:'Close',
				accelerator: 'CmdOrCtrl+W',
				role:'close'
			}
		]
	}
];

global.initApp = function(){
	//If this app is a mac app, we add the standard first menu point containing the about stuff
	if(process.platform == 'darwin'){
		var name = app.getName();
		menuTemplate.unshift({
			label: name,
			submenu:[
				{
					label: 'About '+name,
					role: 'about'
				},
				{
					type:'separator'
				},
				{
					label: 'Services',
					role: 'services',
					submenu:[]
				},
				{
					label: 'Hide '+name,
					accelerator:'Command+H',
					role: 'hide'
				},
				{
					label: 'Hide Others',
					accelerator:'Command+Shift+H',
					role: 'hideothers'
				},
				{
					label: 'Show All',
					role: 'unhide'
				},
				{
					type:'separator'
				},
				{
					label: 'Quit',
					accelerator:'Command+Q',
					click: function(){
						app.quit();
					}
				}
			]
		});

		//Add mac os x specific window command
		menuTemplate[3].submenu.push(
			{
				type:'separator'
			},
			{
				label: 'Bring All to Front',
				role:'front'
			}
		);
	}

	//Activate the menu
	menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);

	//MultiDisplay

	ElectronScreen = require('screen');
	var displays = ElectronScreen.getAllDisplays();
	global.error('displays', displays)
	var externalDisplay = null;
	for (var i in displays) {
		if (displays[i].bounds.x != 0 || displays[i].bounds.y != 0) {
			externalDisplay = displays[i];
			console.log()
			break;
		}
	}

	if (externalDisplay) {
		secondWindow = new BrowserWindow({
			x: externalDisplay.bounds.x + 50,
			y: externalDisplay.bounds.y + 50,
			width:200,
			height:200,
			title: 'Boilerplate:Second Window'
		});

		secondWindow.loadUrl('file://' + __dirname + '/index_second_screen.html');
	}

	ElectronScreen.on('display-added', function(event, newDisplay){
		//Update Window Setup
	});

	ElectronScreen.on('display-removed', function(event, oldDisplay){
		//Update Window Setup
	});

	ElectronScreen.on('display-metrics-changed', function(event, display, changedMetricts){
		//Update Window Setup
	});

	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		x:0,
		y:0,
		title:"Boilerplate"
	});

	//mainWindow.openDevTools();

	mainWindow.loadUrl('file://' + __dirname + '/index.html');

	mainWindow.on('closed', function() {
		mainWindow = null;
		//Close the comment window
	});
};

//Validate folder and open it
global.openFolder = function(path){
	global.error("File dropped",path);
}

//Global error function
global.error = function(str, e){

	var error_html = 'data:text/html;charset=UTF-8,'+encodeURIComponent('<!DOCTYPE html>'+
		'<html>'+
			'<head>'+
				'<meta charset="UTF-8">'+
				'<title>Error</title>'+
				'<link rel="stylesheet" type="text/css" href="css/popup.css">'+
			'</head>'+
			'<body>'+
				'<h1>'+str+'</h1>'+
				'<p>'+JSON.stringify(e)+'</p>'+
			'</body>'+
		'</html>');

	if(errorWindow === null){
		errorWindow = new BrowserWindow({
			width: 400,
			height: 400,
			center:true,
			title:"Boilerplate:Error"
		});
	}

	errorWindow.loadUrl(error_html);

	errorWindow.on('closed', function(){
		errorWindow = null;
	});
};