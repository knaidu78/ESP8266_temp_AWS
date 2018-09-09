load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_dht.js');


// GPIO pin which has a DHT sensor data wire connected
let pin = 5;

// Initialize DHT library
let dht = DHT.create(pin, DHT.DHT11);

let led = Cfg.get('pins.led');
let button = Cfg.get('pins.button');
let topic = '/devices' + '/events' + '/temp_humidity';
let device = Cfg.get('device.id');

print('LED GPIO:', led, 'button GPIO:', button);

let getInfo = function() {
  return JSON.stringify({
    humidity: dht.getHumidity(),
    temperature: dht.getTemp(),
    device: device
  });
};

// Blink built-in LED every second
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
Timer.set(30000 /* 30 sec */, Timer.REPEAT, function() {
  let t = dht.getTemp();
  let h = dht.getHumidity();
  let value = GPIO.toggle(led);
  print('temperature:', t, '*C');
  print('humidity:', h, '%');
  print('device:', device);
  let message = getInfo();
  let ok = MQTT.pub(topic, message, 1);
  print('Published:', ok, topic, '->', message);
}, null);

// Publish to MQTT topic on a button press. Button is wired to GPIO pin 0
GPIO.set_button_handler(button, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 20, function() {
  let message = getInfo();
  let ok = MQTT.pub(topic, message, 1);
  print('Published:', ok, topic, '->', message);
}, null);

// Monitor network connectivity.
Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);
}, null);



