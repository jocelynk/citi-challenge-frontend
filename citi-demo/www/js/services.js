angular.module('starter.services', [])
  .factory('SocketServer', function() {
    var SocketServer = {};

    SocketServer.server = new WebSocket("ws://10.128.16.213:9000/ws");
    SocketServer.server.onopen = function (event) {
      SocketServer.server.send("Message to send");
      console.log(event);

    };

    SocketServer.server.onmessage = function (event) {
      console.log(event);

    };

    SocketServer.server.onclose = function(event) {
      console.log(event)
    };

    return SocketServer;

  })
  .factory('DeviceRegistration', function ($http) {
    var DeviceRegistration = {};
    DeviceRegistration.saveDeviceInfo = function (deviceInfo) {
      return $http.post('http://10.128.16.213:9000/api/device', deviceInfo);

    };

    return DeviceRegistration;

  })
  .factory('BluetoothDiscovery', function ($http) {
    var BluetoothDiscovery = {};
    BluetoothDiscovery.devices = [];

    BluetoothDiscovery.bindCordovaEvents = function() {
      document.addEventListener('bcready', BluetoothDiscovery.onBCReady, false);
    };


    BluetoothDiscovery.onBCReady = function() {
      BC.bluetooth.addEventListener("bluetoothstatechange",BluetoothDiscovery.onBluetoothStateChange);
      BC.bluetooth.addEventListener("newdevice",BluetoothDiscovery.addNewDevice);
    };

    BluetoothDiscovery.onBluetoothStateChange = function(){
      if(BC.bluetooth.isopen){

      }else{
        if(API !== "ios"){
          BC.Bluetooth.OpenBluetooth(function(){
          });
        }else{
          //alert("Please open your bluetooth first.");
        }
      }
    };

    BluetoothDiscovery.onBluetoothDisconnect = function(arg){
      BC.Proximity.clearPathLoss();
      navigator.notification.stopBeep();

    };

    BluetoothDiscovery.onDeviceConnected = function(arg, callback){
      var deviceAddress = arg.deviceAddress;
      //if Device connected, logic to send to serve goes here.

    };

    BluetoothDiscovery.addNewDevice = function(s){
      var newDevice = s.target;
      newDevice.addEventListener("deviceconnected",BluetoothDiscovery.onDeviceConnected);
      newDevice.addEventListener("devicedisconnected",BluetoothDiscovery.onBluetoothDisconnect);
      console.log(s);

    };

    BluetoothDiscovery.onDeviceDisconnected = function(){
      BC.Proximity.clearPathLoss();
      navigator.notification.stopBeep();
    };

    BluetoothDiscovery.manuallyAddNewDevice = function(address, callback) {
      var device = BC.bluetooth.devices[address];
      if(device) {
        device.addEventListener("deviceconnected", function (s) {
          console.log("device:" + s.deviceAddress + "is connected successfully!")
          //logic to send to server goes here
        });

        device.addEventListener("devicedisconnected", function (s) {
          console.log("device:" + s.deviceAddress + "is connected successfully!")
        });
        device.connect(function (success) {
          console.log(success);
          console.log(device);
          BluetoothDiscovery.devices.push({deviceId: device.deviceAddress});
        }, function (err) {
          console.log(err);
          console.log(device);
          console.log("Error connecting");
        });
      }
    };

    BluetoothDiscovery.startScan = function() {
      BC.Bluetooth.StartScan();
    };

    BluetoothDiscovery.stopScan = function() {
      BC.Bluetooth.StopScan();
    };


    return BluetoothDiscovery;

  })
  .factory('Chats', function () {
    // Might use a resource here that returns a JSON array

    // Some fake testing data
    var chats = [{
      id: 0,
      name: 'Ben Sparrow',
      lastText: 'You on your way?',
      face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
    }, {
      id: 1,
      name: 'Max Lynx',
      lastText: 'Hey, it\'s me',
      face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
    }, {
      id: 2,
      name: 'Adam Bradleyson',
      lastText: 'I should buy a boat',
      face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
    }, {
      id: 3,
      name: 'Perry Governor',
      lastText: 'Look at my mukluks!',
      face: 'https://pbs.twimg.com/profile_images/598205061232103424/3j5HUXMY.png'
    }, {
      id: 4,
      name: 'Mike Harrington',
      lastText: 'This is wicked good ice cream.',
      face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png'
    }];

    return {
      all: function () {
        return chats;
      },
      remove: function (chat) {
        chats.splice(chats.indexOf(chat), 1);
      },
      get: function (chatId) {
        for (var i = 0; i < chats.length; i++) {
          if (chats[i].id === parseInt(chatId)) {
            return chats[i];
          }
        }
        return null;
      }
    };
  });
