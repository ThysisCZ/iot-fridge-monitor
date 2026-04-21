#include <application.h>

#define FIRMWARE_VERSION "1.8.0"
#define REPORT_INTERVAL_MS (15 * 60 * 1000) // 15 minute heartbeat
#define UPDATE_INTERVAL (10 * 1000)         // 10 second update
#define DELTA_TEMP 0.5f
#define DELTA_HUMID 5.0f
#define DELTA_ILLUM 5.0f

// Sensor instances
twr_tmp112_t temperature;
twr_sht20_t humidity;
twr_opt3001_t illuminance;

float last_pub_temp = -100.0f;
float last_pub_humid = 0.0f;
float last_pub_illum = 0.0f;
twr_tick_t next_report_tick = 0;

// Central function to send all data
void report_all_data()
{
    float t, h, i, b;

    // Get current values
    twr_tmp112_get_temperature_celsius(&temperature, &t);
    twr_sht20_get_humidity_percentage(&humidity, &h);
    twr_opt3001_get_illuminance_lux(&illuminance, &i);
    twr_module_battery_get_voltage(&b);

    // Publish everything
    twr_radio_pub_temperature(TWR_RADIO_PUB_CHANNEL_R1_I2C0_ADDRESS_DEFAULT, &t);
    twr_radio_pub_humidity(TWR_RADIO_PUB_CHANNEL_R1_I2C0_ADDRESS_DEFAULT, &h);
    twr_radio_pub_luminosity(TWR_RADIO_PUB_CHANNEL_R1_I2C0_ADDRESS_DEFAULT, &i);
    twr_radio_pub_battery(&b);

    // Sync state
    last_pub_temp = t;
    last_pub_humid = h;
    last_pub_illum = i;
    next_report_tick = twr_tick_get() + REPORT_INTERVAL_MS;

    twr_log_debug("Full report sent. T:%.2f H:%.2f I:%.2f", t, h, i);
}

// Temperature handler
void tmp112_event_handler(twr_tmp112_t *self, twr_tmp112_event_t event, void *event_param)
{
    if (event == TWR_TMP112_EVENT_UPDATE)
    {
        float cur_t;
        twr_tmp112_get_temperature_celsius(self, &cur_t);

        if (twr_tick_get() >= next_report_tick || fabsf(cur_t - last_pub_temp) >= DELTA_TEMP)
        {
            report_all_data();
        }
    }
}

// Humidity handler
void sht20_event_handler(twr_sht20_t *self, twr_sht20_event_t event, void *event_param)
{
    if (event == TWR_SHT20_EVENT_UPDATE)
    {
        float cur_h;
        twr_sht20_get_humidity_percentage(self, &cur_h);

        if (twr_tick_get() >= next_report_tick || fabsf(cur_h - last_pub_humid) >= DELTA_HUMID)
        {
            report_all_data();
        }
    }
}

// Illuminance Handler
void opt3001_event_handler(twr_opt3001_t *self, twr_opt3001_event_t event, void *event_param)
{
    if (event == TWR_OPT3001_EVENT_UPDATE)
    {
        float cur_i;
        twr_opt3001_get_illuminance_lux(self, &cur_i);

        if (twr_tick_get() >= next_report_tick || fabsf(cur_i - last_pub_illum) >= DELTA_ILLUM)
        {
            report_all_data();
        }
    }
}

void application_init(void)
{
    twr_log_init(TWR_LOG_LEVEL_DEBUG, TWR_LOG_TIMESTAMP_ABS);
    twr_radio_init(TWR_RADIO_MODE_NODE_SLEEPING);

    // Initialize temperature sensor
    twr_tmp112_init(&temperature, TWR_I2C_I2C0, 0x48);
    twr_tmp112_set_event_handler(&temperature, tmp112_event_handler, NULL);
    twr_tmp112_set_update_interval(&temperature, UPDATE_INTERVAL);

    // Initialize humidity sensor
    twr_sht20_init(&humidity, TWR_I2C_I2C0, 0x40);
    twr_sht20_set_event_handler(&humidity, sht20_event_handler, NULL);
    twr_sht20_set_update_interval(&humidity, UPDATE_INTERVAL);

    // Initialize illuminance sensor
    twr_opt3001_init(&illuminance, TWR_I2C_I2C0, 0x44);
    twr_opt3001_set_event_handler(&illuminance, opt3001_event_handler, NULL);
    twr_opt3001_set_update_interval(&illuminance, UPDATE_INTERVAL);

    twr_radio_pub_string("info", FIRMWARE_VERSION);

    report_all_data();
}