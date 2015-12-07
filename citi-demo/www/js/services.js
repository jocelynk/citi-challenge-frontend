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
  .factory('BeaconInfo', function () {
    var BeaconInfo = {};
    BeaconInfo.beacons = {};
    BeaconInfo.beaconRegions =
      [
        {
          id: 'region1',
          identifier: 'estimote',
          uuid:'b9407f30-f5f8-466e-aff9-25556b57fe6d',
          major: '30201',
          minor: '10'
        }
      ];

    BeaconInfo.masterDeviceId = null;
    BeaconInfo.locationManager = null;
    BeaconInfo.server = null;

    BeaconInfo.getLocationManager = function() {
      BeaconInfo.locationManager = cordova.plugins.locationManager;
    };

    BeaconInfo.didRangeBeaconsInRegion = function(pluginResult)
    {
      // There must be a beacon within range.
      if (0 == pluginResult.beacons.length)
      {
        return
      }

      // Our regions are defined so that there is one beacon per region.
      // Get the first (and only) beacon in range in the region.
      var beacon = pluginResult.beacons[0];
      console.log(beacon.proximity);
      var uniqueBeaconKey = beacon.uuid + ":" + beacon.major + ":" + beacon.minor;
      //BeaconInfo.beacons[uniqueBeaconKey] = beacon;

      var originalProximity = '';
      if (angular.isDefined(BeaconInfo.beacons[uniqueBeaconKey]) && BeaconInfo.beacons[uniqueBeaconKey] !== null) {
        originalProximity = BeaconInfo.beacons[uniqueBeaconKey]['proximity'];
      }

      BeaconInfo.beacons[uniqueBeaconKey] = beacon;

      if(BeaconInfo.server) {

        switch (BeaconInfo.beacons[uniqueBeaconKey]['proximity']) {
          case 'ProximityImmediate':
            BeaconInfo.beacons[uniqueBeaconKey]['proximity'] = 1;
            break;
          case 'ProximityNear':
            BeaconInfo.beacons[uniqueBeaconKey]['proximity'] = 2;
            break;
          case 'ProximityFar':
            BeaconInfo.beacons[uniqueBeaconKey]['proximity'] = 3;
            break;
          default:
            BeaconInfo.beacons[uniqueBeaconKey]['proximity'] = -1;
            break;
        }

        if (originalProximity != BeaconInfo.beacons[uniqueBeaconKey]['proximity']) {
          var beaconDevice = {
            masterId: BeaconInfo.masterDeviceId,
            event: "LOGIN_DEVICES",
            deviceName: 'ESTIMOTE',
            deviceId: BeaconInfo.beacons[uniqueBeaconKey].uuid,
            deviceType: "BEACON",
            proximity: BeaconInfo.beacons[uniqueBeaconKey]['proximity']
          };

          BeaconInfo.server.send(JSON.stringify(beaconDevice));
          //$scope.server.send(JSON.stringify(beaconDevice));
        }

      }

    };

    BeaconInfo.startScanForBeacons = function()
    {
      //console.log('startScanForBeacons')

      // The delegate object contains iBeacon callback functions.
      // The delegate object contains iBeacon callback functions.
      var delegate = new cordova.plugins.locationManager.Delegate();

      delegate.didDetermineStateForRegion = function(pluginResult)
      {
        //console.log('didDetermineStateForRegion: ' + JSON.stringify(pluginResult))
      };

      delegate.didStartMonitoringForRegion = function(pluginResult)
      {
        //console.log('didStartMonitoringForRegion:' + JSON.stringify(pluginResult))
      };

      delegate.didRangeBeaconsInRegion = function(pluginResult)
      {
        //console.log('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult))
        BeaconInfo.didRangeBeaconsInRegion(pluginResult)
      };

      // Set the delegate object to use.
      BeaconInfo.locationManager.setDelegate(delegate);

      // Start monitoring and ranging our beacons.
      for (var r = 0; r < BeaconInfo.beaconRegions.length; r++)
      {
        var region = BeaconInfo.beaconRegions[r];

        var beaconRegion = new BeaconInfo.locationManager.BeaconRegion(
          region.identifier, region.uuid, region.major, region.minor);

        // Start monitoring.
        BeaconInfo.locationManager.startMonitoringForRegion(beaconRegion)
          .fail(console.error)
          .done();

        // Start ranging.
        BeaconInfo.locationManager.startRangingBeaconsInRegion(beaconRegion)
          .fail(console.error)
          .done()
      }
    };

    return BeaconInfo;
  })
  .factory('DeviceRegistration', function ($http) {
    var DeviceRegistration = {};
    DeviceRegistration.saveDeviceInfo = function (deviceInfo) {
      return $http.post('http://calm-sands-9581.herokuapp.com/api/device', deviceInfo);

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
          //if address not in here push
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
