angular.module('starter.services', [])
  .factory('DeviceInformation', function () {
    var DeviceInformation = {
      deviceUUID: null,
      wifiSSID: null,
      ipAddress: null,
      bluetoothDevices: [],
      beacons: {}
    };

    return DeviceInformation

  })
  .factory('SocketServer', function () {
    var SocketServer = {};

    SocketServer.server = new WebSocket("ws://10.128.7.83:9000/ws");
    SocketServer.server.onopen = function (event) {
      SocketServer.server.send("Message to send");
      console.log(event);

    };

    SocketServer.server.onmessage = function (event) {
      console.log(event);

    };

    SocketServer.server.onclose = function (event) {
      console.log(event)
    };

    return SocketServer;

  })
  .factory('DeviceRegistration', function ($http) {
    var DeviceRegistration = {};
    DeviceRegistration.saveDeviceInfo = function (deviceInfo) {
      return $http.post('http://10.128.7.83:9000/api/device', deviceInfo);

    };

    return DeviceRegistration;

  })
  .factory('BluetoothDiscovery', function ($http) {
    var BluetoothDiscovery = {};
    BluetoothDiscovery.devices = [];
    BluetoothDiscovery.pairedDevices = [];

    var observerCallbacks = [];

    //register an observer
    BluetoothDiscovery.registerObserverCallback = function(callback){
      observerCallbacks.push(callback);
    };

    //call this when you know 'foo' has been changed
    var notifyObservers = function(device){
      angular.forEach(observerCallbacks, function(callback){
        if(callback) callback(device);
      });
    };

    BluetoothDiscovery.bindCordovaEvents = function () {
      document.addEventListener('bcready', BluetoothDiscovery.onBCReady, false);
    };


    BluetoothDiscovery.onBCReady = function () {
      BC.bluetooth.addEventListener("bluetoothstatechange", BluetoothDiscovery.onBluetoothStateChange);
      BC.bluetooth.addEventListener("newdevice", BluetoothDiscovery.addNewDevice);
      BC.Bluetooth.StopScan();
      BC.Bluetooth.StartScan();
      BC.Bluetooth.GetPairedDevices(function (mes) {
        for (var i = 0; i < mes.length; i++) {
          BluetoothDiscovery.pairedDevices.push(mes[i].deviceAddress);
        }
      });
    };

    BluetoothDiscovery.onBluetoothStateChange = function () {
      if (BC.bluetooth.isopen) {

      } else {
        if (API !== "ios") {
          BC.Bluetooth.OpenBluetooth(function () {
          });
        } else {
          //alert("Please open your bluetooth first.");
        }
      }
    };

    BluetoothDiscovery.onBluetoothDisconnect = function (arg) {
      //BC.Proximity.clearPathLoss();
      //navigator.notification.stopBeep();

    };

    BluetoothDiscovery.onDeviceConnected = function (arg, callback) {
      var deviceAddress = arg.deviceAddress;
      //if Device connected, logic to send to serve goes here.

    };

    function findElement(arr, propName, propValue) {
      for (var i=0; i < arr.length; i++)
        if (arr[i][propName] == propValue)
          return arr[i];

      return null;
    }

    BluetoothDiscovery.addNewDevice = function (s) {
      var newDevice = s.target;
      newDevice.addEventListener("deviceconnected", BluetoothDiscovery.onDeviceConnected);
      newDevice.addEventListener("devicedisconnected", BluetoothDiscovery.onBluetoothDisconnect);
      if (newDevice && BluetoothDiscovery.pairedDevices.indexOf(newDevice.deviceAddress) > -1) {
        if(findElement(BluetoothDiscovery.devices, 'deviceAddress', newDevice.deviceAddress) == null) {
          var device = {deviceName: newDevice.deviceName || null, deviceAddress: newDevice.deviceAddress || null};
          BluetoothDiscovery.devices.push(device);
          notifyObservers(device);
        }
        newDevice.addEventListener("deviceconnected", function (s) {
          console.log("device:" + s.deviceAddress + "is connected successfully!")
          //logic to send to server goes here
        });

        newDevice.addEventListener("devicedisconnected", function (s) {
          console.log("device:" + s.deviceAddress + "is disconnected!")
        });
        newDevice.connect(function (success) {
          console.log("Successfully Connected");
          console.log(newDevice);
          if(findElement(BluetoothDiscovery.devices, 'deviceAddress', newDevice.deviceAddress) == null) {
            var device = {deviceName: newDevice.deviceName || null, deviceAddress: newDevice.deviceAddress || null};
            BluetoothDiscovery.devices.push(device);
            notifyObservers(device);
          }
        }, function (err) {
          console.log("Error connecting");
        });
      }

    };

    BluetoothDiscovery.onDeviceDisconnected = function () {
      BC.Proximity.clearPathLoss();
      navigator.notification.stopBeep();
    };

    BluetoothDiscovery.manuallyAddNewDevice = function (address, callback) {
      var device = BC.bluetooth.devices[address];
      if (device) {
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

    BluetoothDiscovery.startScan = function () {
      //LE or Classical
      BC.Bluetooth.StartScan();
    };

    BluetoothDiscovery.stopScan = function () {
      BC.Bluetooth.StopScan();
    };


    return BluetoothDiscovery;

  })
  .factory('ProximityProfile', function () {
    var ProximityProfile = {};
    ProximityProfile.proximity = new BC.ProximityProfile();
    ProximityProfile.safety_value = -20;
    ProximityProfile.unsafety_value = -40;
    ProximityProfile.isFirstTime = true;
    ProximityProfile.antiLostIsOpen = true;
    ProximityProfile.safetyAlarmIsOpen = true;
    ProximityProfile.isFirstConnect = true;
    ProximityProfile.stateModel = 0;
    ProximityProfile.reconnected = false;
    ProximityProfile.setPictureModel = false;
    ProximityProfile.isAlert = false;

    ProximityProfile.farAwayFunc =  function() {
      console.log("App is out of safety zone");
      //geolocation?
    };

    ProximityProfile.safetyZone_func = function() {
      console.log("App is out of safety zone");
    };


    ProximityProfile.closeToFunc =  function() {
      console.log("App is out of safety zone");
    };


    //app.safety_value = parseInt(this.value) > -20 ? -1 : parseInt(this.value) + 20;
    //app.unsafety_value = parseInt(this.value);
    ProximityProfile.initProximity = function (device) {
      ProximityProfile.proximity.clearPathLoss();
      ProximityProfile.proximity.onPathLoss(device, ProximityProfile.safety_value, ProximityProfile.unsafety_value, ProximityProfile.farAwayFunc, ProximityProfile.safetyZone_func, ProximityProfile.closeToFunc);
    };

    return ProximityProfile;

  });
