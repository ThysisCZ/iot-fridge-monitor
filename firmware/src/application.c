#include <application.h>

#define FIRMWARE_VERSION "1.8.0"

void application_init(void) {
    twr_log_init(TWR_LOG_LEVEL_DEBUG, TWR_LOG_TIMESTAMP_ABS);

    // Initialize radio dongle
    twr_radio_init(TWR_RADIO_MODE_NODE_SLEEPING);

    // Send the firmware version to MQTT
    twr_radio_pub_string("info", FIRMWARE_VERSION);

    twr_log_debug("Firmware version: ", FIRMWARE_VERSION);
}