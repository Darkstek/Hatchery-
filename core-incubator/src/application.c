/**
 * @file application.c
 * @brief Firmware pro monitorování teploty a baterie v inkubátoru (IoT uzel).
 * @author Pavel Černý, Barbora Šimková, Štěpán Hruška, Tereza Holubcová, Václav Haba
 * @version 1.1
 * * Tento kód inicializuje teploměr TMP112 a modul baterie. Odesílá naměřená data
 * v pravidelných intervalech přes rádiový modul do brány (Gateway).
 */

#include <application.h>

/** @brief Instance LED ovladače pro vizuální signalizaci */
twr_led_t led;

/** @brief Instance ovladače teploměru TMP112 */
twr_tmp112_t tmp112;

/**
 * @brief Callback funkce, která obsluhuje události z modulu baterie.
 * @param event Typ události (aktualizace napětí).
 * @param event_param Volitelný parametr.
 */
void battery_event_handler(twr_module_battery_event_t event, void *event_param)
{
    // Reagujeme na aktualizaci naměřeného napětí
    if (event == TWR_MODULE_BATTERY_EVENT_UPDATE)
    {
        float voltage;
        
        // Přečtení aktuálního napětí baterie
        if (twr_module_battery_get_voltage(&voltage))
        {
            // Výpis do ladicí konzole
            twr_log_debug("APP: Napětí baterie: %.2f V", voltage);

            // Odeslání hodnoty napětí rádiem
            twr_radio_pub_battery(&voltage);
        }
    }
}

/**
 * @brief Callback funkce, která obsluhuje události z teploměru.
 * @param self Ukazatel na instanci teploměru.
 * @param event Typ události.
 * @param event_param Volitelný parametr.
 */
void tmp112_event_handler(twr_tmp112_t *self, twr_tmp112_event_t event, void *event_param)
{
    if (event == TWR_TMP112_EVENT_UPDATE)
    {
        float celsius;
        
        if (twr_tmp112_get_temperature_celsius(self, &celsius))
        {
            twr_log_debug("APP: Teplota naměřena: %.2f °C", celsius);

            twr_radio_pub_temperature(TWR_RADIO_PUB_CHANNEL_R1_I2C0_ADDRESS_ALTERNATE, &celsius);
            
            twr_led_pulse(&led, 50);
        }
    }
}

/**
 * @brief Hlavní inicializační funkce aplikace. Volá se jednou po startu.
 */
void application_init(void)
{
    twr_log_init(TWR_LOG_LEVEL_DUMP, TWR_LOG_TIMESTAMP_ABS);

    twr_led_init(&led, TWR_GPIO_LED, false, 0);
    twr_led_pulse(&led, 2000);

    // Inicializace senzoru TMP112
    twr_tmp112_init(&tmp112, TWR_I2C_I2C0, 0x49);
    twr_tmp112_set_event_handler(&tmp112, tmp112_event_handler, NULL);
    twr_tmp112_set_update_interval(&tmp112, 600000);  // 10 minut
    //twr_tmp112_set_update_interval(&tmp112, 60000); // 1 minuta pro vývoj

    // Inicializace modulu baterie
    twr_module_battery_init();
    twr_module_battery_set_event_handler(battery_event_handler, NULL);
    twr_module_battery_set_update_interval(3600000); // 1 hodina (šetří energii)
    //twr_module_battery_set_update_interval(10000); // 10 sekund pro vývoj

    twr_radio_init(TWR_RADIO_MODE_NODE_SLEEPING);
    
    twr_radio_pairing_request("inkubator-projekt", FW_VERSION);
}

/**
 * @brief Periodicky volaná funkce pro naplánované úlohy.
 */
void application_task(void)
{
    // Ponecháno prázdné pro budoucí rozšíření
}