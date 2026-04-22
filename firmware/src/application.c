#include <application.h>

#define FIRMWARE_VERSION "1.8.0"
#define REPORT_INTERVAL_MS (100 * 1000) // 100 second heartbeat
#define UPDATE_INTERVAL (10 * 1000)     // 10 second update
#define DELTA_TEMP 0.5f
#define DELTA_HUMID 5.0f
#define DELTA_ILLUM 5.0f

// Sensor readiness
bool temp_ready = false;
bool humid_ready = false;
bool illum_ready = false;

float last_pub_temp = -100.0f;
float last_pub_humid = 0.0f;
float last_pub_illum = 0.0f;
twr_tick_t next_report_tick = 0;

// Central function to send all data
void report_all_data()
{
    // Cancel data sending if sensors aren't ready yet
    if (!temp_ready || !humid_ready || !illum_ready)
    {
        return;
    }

    float t, h, i, b;

    // Get current values
    twr_module_climate_get_temperature_celsius(&t);
    twr_module_climate_get_humidity_percentage(&h);
    twr_module_climate_get_illuminance_lux(&i);
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
    temp_ready = humid_ready = illum_ready = false;

    next_report_tick = twr_tick_get() + REPORT_INTERVAL_MS;

    twr_log_debug("Full report sent. T:%.2f H:%.2f I:%.2f", t, h, i);
}

void climate_module_event_handler(twr_module_climate_event_t event, void *event_param)
{
    float val;

    // Temperature event
    if (event == TWR_MODULE_CLIMATE_EVENT_UPDATE_THERMOMETER)
    {
        twr_module_climate_get_temperature_celsius(&val);
        if (fabsf(val - last_pub_temp) >= DELTA_TEMP)
        {
            temp_ready = true;
        }
    }

    // Humidity event
    if (event == TWR_MODULE_CLIMATE_EVENT_UPDATE_HYGROMETER)
    {
        twr_module_climate_get_humidity_percentage(&val);
        if (fabsf(val - last_pub_humid) >= DELTA_HUMID)
        {
            humid_ready = true;
        }
    }

    // Illuminance event
    if (event == TWR_MODULE_CLIMATE_EVENT_UPDATE_LUX_METER)
    {
        twr_module_climate_get_illuminance_lux(&val);
        if (fabsf(val - last_pub_illum) >= DELTA_ILLUM)
        {
            illum_ready = true;
        }
    }

    // Check heartbeat
    if (twr_tick_get() >= next_report_tick)
    {
        temp_ready = humid_ready = illum_ready = true;
    }

    report_all_data();
}

void application_init(void)
{
    twr_log_init(TWR_LOG_LEVEL_DEBUG, TWR_LOG_TIMESTAMP_ABS);

    twr_module_climate_init();

    twr_module_climate_set_event_handler(climate_module_event_handler, NULL);
    twr_module_climate_set_update_interval_all_sensors(UPDATE_INTERVAL);

    twr_radio_init(TWR_RADIO_MODE_NODE_SLEEPING);
    twr_module_battery_init();
    twr_module_battery_set_update_interval(UPDATE_INTERVAL);

    twr_radio_pub_string("info", FIRMWARE_VERSION);
}