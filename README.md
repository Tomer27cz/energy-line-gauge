# Energy Line Gauge
[![GitHub package.json version](https://img.shields.io/github/package-json/v/Tomer27cz/energy-line-gauge)](https://github.com/Tomer27cz/energy-line-gauge/blob/master/package.json)
[![Validate HACS](https://github.com/Tomer27cz/energy-line-gauge/actions/workflows/validate-hacs.yaml/badge.svg)](https://github.com/Tomer27cz/energy-line-gauge/actions/workflows/validate-hacs.yaml)
[![GitHub license](https://img.shields.io/github/license/Tomer27cz/energy-line-gauge)](https://img.shields.io/github/license/Tomer27cz/energy-line-gauge/blob/master/LICENSE)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/custom-components/hacs)

<h1 align="center">A line Gauge with a focus on Energy Usage</h1>
<p align="center">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/main.gif" alt="Main Image"/>
</p>

<p align="center">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/only_gauge.png" alt="Only Gauge"/>
</p>

<p align="center">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/only_gauge_entities.png" alt="Only Gauge"/>
</p>

The main idea of this card is to show the energy consumption of your devices as a percentage of the **main entity** (your entity for tracking whole **house consumption**).


The card is designed to resemble the Home Assistant **Energy panel** style. The **auto color** option will use the colors in the same order as the energy panel. 

<div id="installation">
<h1> Installation</h1>

<a href="https://my.home-assistant.io/redirect/hacs_repository/?owner=Tomer27cz&amp;repository=energy-line-gauge&amp;category=plugin" target="_blank" rel="noreferrer noopener"><img src="https://my.home-assistant.io/badges/hacs_repository.svg" alt="Open your Home Assistant instance and open a repository inside the Home Assistant Community Store."></a>

<h2> Manual installation via <a href="https://hacs.xyz/">HACS</a> <img src="https://img.shields.io/badge/-Recommended-%2303a9f4"/></h2>

1. Make sure the [HACS](https://github.com/custom-components/hacs) custom component is installed and working.
2. Click on the three dots and add this custom repository
3. Repository: `https://github.com/Tomer27cz/energy-line-gauge`, Type: `Dashboard`
4. Search for `energy-line-gauge` and add it through HACS
5. Refresh home-assistant.


<h2> Installation via <a href="https://hacs.xyz/">HACS</a> (currently not in the store - waiting for pull request) </h2>

1. Make sure the [HACS](https://github.com/custom-components/hacs) custom component is installed and working.
2. Search for `energy-line-gauge` and add it through HACS
3. Refresh home-assistant.

<h2> Manual installation</h2>

1. Download the [energy-line-gauge](http://www.github.com/Tomer27cz/energy-line-gauge/releases/latest/download/energy-line-gauge.js) (`energy-line-gauge.js` from latest release)
2. Create a `energy-line-gauge` folder your `config/www` folder and place the file in there
3. Include the card code in your `ui-lovelace-card.yaml`
  ```yaml
  resources:
    - url: /local/energy-line-gauge.js
      type: module
  ```
Or alternatively set it up via the UI:
`Configuration -> Lovelace Dashboards -> Resources (TAB)`
For more guidance check out the [docs](https://developers.home-assistant.io/docs/frontend/custom-ui/registering-resources/).

</div>

***

<div id="configuration">
<h1> Configuration</h1>

Version 2.0 added a **Visual Editor** to make the configuration easier.
You can find the Card in your Card Selector or by scrolling down to the bottom of the Card Selector and selecting `Manual Card`.
Then you can paste the following code into the Card Editor:
`type: 'custom:energy-line-gauge'`

### Visual Editor

<p align="center">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/visual_editor_appearance.png" alt="Visual Editor Appearance"/>
</p>

<p align="center">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/visual_editor_untracked_interactions.png" alt="Visual Editor Untracked + Interactions"/>
</p>

<p align="center">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/visual_editor_entities.png" alt="Visual Editor Entities"/>
</p>

<br/>

[//]: # (<p align="center">)

[//]: # (<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/visual_editor.gif" alt="Visual Editor"/>)

[//]: # (</p>)

## YAML Only

Some features are not yet available in the Visual Editor. For example the ability to set `min` and `max` to be an entity or color `auto`.
```yaml
type: 'custom:energy-line-gauge'
entity: sensor.glow_power_consumption
title: Power Consumption
subtitle: Glow
min: 0
max: sensor.glow_power_consumption
precision: 0
unit: W
cutoff: 5
offset: 1d
corner: 'square'
position: 'left'
line_text_position: 'bottom-right'
line_text_size: 1.5
color: "#00aafa"
color_bg:
    - 40
    - 40
    - 40
tap_action:
  action: more-info
  entity: sensor.glow_power_consumption
hold_action:
  action: none
double_tap_action:
  action: none
legend_hide: false
legend_all: false
show_delta: false
untracked_legend: true
untracked_legend_label: Untracked
untracked_legend_icon: mdi:flash
untracked_state_content:
  - name
  - state
untracked_line_state_content:
  - percentage
suppress_warnings: false
statistics: false
statistics_day_offset: 1
statistics_period: 'hour'
statistics_function: 'mean'
entities:
  - entity: sensor.plug_0_power
    name: Plug 0
    icon: mdi:flash
    color: "auto"
    cutoff: 5
    unit: W
    multiplier: 1
    precision: 0
    state_content:
      - name
      - state
      - percentage 
    line_state_content:
      - percentage
  - entity: sensor.plug_1_power
    name: Plug 1
    color:
      - 244
      - 189
      - 74
```

## Main Options

There are a lot of settings you can customize your sensors with:

| Setting                        |       type       |           default            |                                         example                                          | description                                                                                                                                                                                                                          |
|--------------------------------|:----------------:|:----------------------------:|:----------------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `entity`                       |      string      |          ! required          |                                       sensor.power                                       | You can specify the entity_id here as well.                                                                                                                                                                                          | 
| `title`                        |      string      |            [...]             |                                    Power Consumption                                     | The title of the Card (font_size: 2rem)                                                                                                                                                                                              |
| `subtitle`                     |      string      |            [...]             |                                           Glow                                           | Text in gray below the title (font_size: 1rem)                                                                                                                                                                                       |
| `min`                          | number or string |              0               |                                           100                                            | The minimum value of the gauge. Can be an entity_id.                                                                                                                                                                                 |
| `max`                          | number or string |           [entity]           |                                       sensor.power                                       | The maximum value of the gauge. Can be an entity_id.                                                                                                                                                                                 |
| `precision`                    |      number      |              0               |                                            2                                             | The number of decimals to display.                                                                                                                                                                                                   |
| `unit`                         |      string      |            [...]             |                                            W                                             | This string will be appended to the end of the value.                                                                                                                                                                                |
| `cutoff`                       |      number      |              5               |                                            10                                            | Any entity with a value below this will not be displayed.                                                                                                                                                                            |
| `offset`                       |      string      |            [...]             |                                            1d                                            | Offset state into the past [see more](#offset).                                                                                                                                                                                      |
| `corner`                       |      string      |            square            |                                         circular                                         | The theme (shape) of the gauge [see more](#theme)                                                                                                                                                                                    |
| `position`                     |      string      |             left             |                                           none                                           | Position of the main label [see more](#position)                                                                                                                                                                                     |
| `text_size`                    |      number      |             2.5              |                                            2                                             | Font size of the main value (in rem).                                                                                                                                                                                                |
| `line_text_position`           |      string      |             left             |                                       bottom-right                                       | Position of the state content in the line ['left', 'right', 'center', 'top-...', 'bottom-...']                                                                                                                                       |
| `line_text_size`               |      number      |              1               |                                           1.5                                            | Font size of the state content in the line (in rem)                                                                                                                                                                                  |
| `color`                        |  string or rgb   |       [primary-color]        |                                         #00aafa                                          | The color of the gauge. And the untracked legend.                                                                                                                                                                                    |                                                                 
| `color_bg`                     |  string or rgb   | [secondary-background-color] |                                       [40, 40, 40]                                       | The background color of the gauge. Only visible if the gauge is not filled (max is entity).                                                                                                                                          |
| `tap_action`                   |  Action Config   |          more-info           | [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables) | Single tap action for item.                                                                                                                                                                                                          |
| `hold_action`                  |  Action Config   |          more-info           | [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables) | Hold action for item.                                                                                                                                                                                                                |
| `double_tap_action`            |  Action Config   |             none             | [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables) | Double tap action for item.                                                                                                                                                                                                          |
| `legend_hide`                  |       bool       |            false             |                                           true                                           | This will hide the legend = only line visible. [example](#legend_hide)                                                                                                                                                               |
| `legend_all`                   |       bool       |            false             |                                          false                                           | Display all the entities regardless of the cutoff. (does not affect gauge) [example](#legend_all)                                                                                                                                    |
| `show_delta`                   |       bool       |            false             |                                           true                                           | Show the state, sum and delta of all the devices in respect to the main entity. [example](#delta)                                                                                                                                    |
| `untracked_legend`             |       bool       |             true             |                                          false                                           | Show the legend for untracked consumption.                                                                                                                                                                                           |
| `untracked_legend_label`       |      string      |    Untracked consumption     |                                        Untracked                                         | The label for the untracked legend. (default is translated)                                                                                                                                                                          |
| `untracked_legend_icon`        |      string      |            [...]             |                                        mdi:flash                                         | Display an icon instead of the colored circle. (icon will also be colored)                                                                                                                                                           |
| `untracked_state_content`      |     string[]     |           ['name']           |                                        ['state']                                         | What info will be shown after the circle or icon. Order matters. Info will be separated by a dot. Options: `name`,`state`,`percentage`                                                                                               |
| `untracked_line_state_content` |     string[]     |            [...]             |                                      ['percentage']                                      | Info will be shown in the line. Order matters. Info will be separated by a dot. Options: `name`,`state`,`percentage`                                                                                                                 |
| `suppress_warnings`            |       bool       |            false             |                                           true                                           | Do not show the warnings, such as "Entity unavailable" or "Entity not found"                                                                                                                                                         |
| `statistics`                   |       bool       |            false             |                                           true                                           | Enable the statistic data. Data from statistic will be displayed instead of current state [see more](#statistics).                                                                                                                   |
| `statistics_day_offset`        |      number      |              1               |                                            7                                             | Whole number of days into the past.                                                                                                                                                                                                  |
| `statistics_period`            |      string      |             hour             |                                           day                                            | Statistical period [see more](#statistics). Options: `5minute`, `hour`, `day`, `week`, `month`                                                                                                                                       |
| `statistics_function`          |      string      |             mean             |                                           max                                            | Statistical function [see more](#statistics). Options: `change`, `max`, `mean`, `min`, `state`, `sum`                                                                                                                                |
| `entities`                     |     Entities     |            [...]             |                                    (Example in yaml)                                     | The list of entities. Config [here.](#entities)                                                                                                                                                                                      |
<p> 

## Entities

<div id="entities">

<p align="center">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/visual_editor_entity.png" alt="Visual Editor Entity"/>
</p>

The only required field is `entity`. The rest of the fields are optional. Color `auto` can only be set in the YAML file (or it will be set to `auto` by default when creating the card).

#### Each entity has its own settings:

| Setting              |     type      |    default    |                                         example                                          | description                                                                                                                                          |
|----------------------|:-------------:|:-------------:|:----------------------------------------------------------------------------------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------------|
| `entity`             |    string     |  ! required   |                                   sensor.plug_0_power                                    | You can specify the entity_id here as well.                                                                                                          | 
| `name`               |    string     |     [...]     |                                          Plug 0                                          | The name of the entity to be displayed in the legend.                                                                                                |
| `icon`               |    string     |     [...]     |                                        mdi:flash                                         | Display an icon instead of the colored circle. (icon will also be colored) [example](#icon)                                                          |
| `color`              | string or rgb |     auto      |                                           auto                                           | The color of the gauge and legend. (auto: Home Assistant Energy panel - the same order)                                                              |
| `cutoff`             |    number     |  [main = 5]   |                                            10                                            | Any entity with a value below this will not be displayed.                                                                                            |
| `unit`               |    string     | [entity unit] |                                            kW                                            | String that is added to the end of entity state.                                                                                                     |
| `multiplier`         |    number     |       1       |                                          0.001                                           | Entity state will be multiplied by this number. Useful when you have entities in kW and W. Automatically set (adjusts to be the same as main entity) |
| `precision`          |    number     |  [main = 0]   |                                            1                                             | Will override main precision pre entity.                                                                                                             |
| `state_content`      |   string[]    |   ['name']    |                                    ['name', 'state']                                     | ['name','state','last_changed','last_updated', 'percentage'] - Order matters. Info will be separated by a dot.                                       |
| `line_state_content` |   string[]    |     [...]     |                                 ['percentage', 'state']                                  | ['name','state','last_changed','last_updated', 'percentage'] - Order matters. Info will be separated by a dot.                                       |
| `tap_action`         | Action Config |   more-info   | [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables) | Single tap action for item.                                                                                                                          |
| `hold_action`        | Action Config |   more-info   | [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables) | Hold action for item.                                                                                                                                |
| `double_tap_action`  | Action Config |     none      | [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables) | Double tap action for item.                                                                                                                          |
<p> 

</div>

</div>

<hr/>

<div id="example">

## Examples

### Icons in the legend

<div id="icon">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/icons.png">

```yaml
type: 'custom:energy-line-gauge'
entity: sensor.glow_power_consumption
entities:
  - entity: sensor.pc_power
    name: Plug 0
    icon: mdi:desktop-classic
  - entity: sensor.stove_power
    name: Plug 1
    icon: mdi:stove
untracked_legend_icon: mdi:flash
untracked_state_content:
  - name
  - state
```
</div>

### Only Line

<div id="legend_hide">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/only_line_entities.png">

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/only_line_max.png">

```yaml
type: 'custom:energy-line-gauge'
entity: sensor.glow_power_consumption
position: none
legend_hide: true
corner: square
```
</div>

### Delta

<div id="delta">
Shows the difference between the main entity and the sum of all the entities.

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/delta.png">

```yaml
type: 'custom:energy-line-gauge'
entity: sensor.glow_power_consumption
legend_hide: true
show_delta: true
corner: square
position: left
entities:
  ...
```
</div>

### Legend with all entities

<div id="legend_all">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/legend_all.png">

```yaml
type: 'custom:energy-line-gauge'
entity: sensor.glow_power_consumption
legend_all: true
corner: square
position: left
entities:
  ...
```
</div>

### Normal usage ( how I use it )

Mainly using the default settings. 
I am using the automatic color option, and I have the entities in the same order as I have them in the Home Assistant Energy panel.

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/normal.png">

```yaml
type: custom:energy-line-gauge
entity: sensor.glow_power_consumption
min: 0
unit: W
entities:
  - entity: sensor.plug_0_power
    name: PC
  - entity: sensor.nous_zigbee_plug_power
    name: Bed
  - entity: sensor.immax_wifi_plug_wattage
    name: Bedroom Outlet
  ...
untracked_legend: true
untracked_legend_label: Untracked
```

<div id="position">

## Position

<hr/>

### `position: none`

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/none.png">

### `position: left`

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/left.png">

### `position: right`

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/right.png">

### `position: top-left`

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/top_left.png">

### `position: top-center`

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/top_center.png">

### `position: top-right`

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/top_right.png">

</div>

<div id="theme">

## Theme

<hr/>

### `corner: square`

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/theme/square.png">

### `corner: lite_rounded`

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/theme/lite_rounded.png">

### `corner: medium_rounded`

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/theme/medium_rounded.png">

### `corner: rounded`

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/theme/rounded.png">

### `corner: circular`

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/theme/circular.png">

</div>

## State Content

<div id="state_content">
The state content is the text displayed in the legend and the line. You can choose what to display and in which order.  The order in the config matters. The text will be separated by a dot.

The position of the text in the line is set by `line_text_position`. Options are `left`, `right`, `center`, `top-left`, `top-right`, `top-center`, `bottom-left`, `bottom-right`, `bottom-center`.

| Option         | description                                                  |    Example    |
|----------------|--------------------------------------------------------------|:-------------:|
| `name`         | Specified in config or if not the `friendly_name` attribute. |    Plug 1     |
| `state`        | The state of the entity, with the `unit` added at the end.   |     158 W     |
| `last_changed` | The last time the entity changed state.                      | 6 seconds ago |
| `last_updated` | The last time the entity was updated.                        | 6 seconds ago |
| `percentage`   | The percentage of the entity in respect to the main entity.  |      55%      |

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/state_content.png">

```yaml
type: custom:energy-line-gauge
entity: input_number.test_num_2
min: 0
max: 100
entities:
  - entity: input_number.test_num
    color: auto
    state_content:
      - name
      - state
      - percentage
    line_state_content:
      - state
      - percentage
line_text_position: left
line_text_size: 1
untracked_legend: false
```
</div>

### Untracked State Content

<div id="untracked_state_content">

| Option         | description                                                                                       |  Example  |
|----------------|---------------------------------------------------------------------------------------------------|:---------:|
| `name`         | Specified in config or `Untracked consumption`(translated).                                       | Untracked |
| `state`        | Main entity state minus sum of device states, with the `unit` added at the end. (can be negative) |   -15 W   |
| `percentage`   | One hundred minus the sum of device widths                                                        |    3%     |


<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/untracked_state_content.png">

```yaml
type: custom:energy-line-gauge
entity: input_number.test_num_2
min: 0
max: 100
entities:
  - entity: input_number.test_num
    color: auto
    line_state_content:
      - percentage
line_text_position: center
line_text_size: 2
legend_hide: true
untracked_legend: false
untracked_line_state_content:
  - percentage
```
</div>

## Offset

<div id="offset">

Added in [v2.1.6](https://github.com/Tomer27cz/energy-line-gauge/releases/tag/v2.1.6). Feature request [#3](https://github.com/Tomer27cz/energy-line-gauge/issues/3) (see for more info).

The offset is the time into the past that the state will be displayed. The offset is in seconds, minutes or days. It has to be a **whole positive number**. Examples `1d`, `80s`, `60m` or `2h`.

The recommended *minimum* is 60 seconds, use a lower number at your own risk. Lower numbers mean more requests to the recorder. The maximum offset depends on your recorder settings. The default is 10 days. If you want to use a higher number, you have to change the `purge_keep_days` setting in your recorder settings.

</div>

## Statistics

<div id="statistics">

Added in [v2.1.7](https://github.com/Tomer27cz/energy-line-gauge/releases/tag/v2.1.7). Feature request [#3](https://github.com/Tomer27cz/energy-line-gauge/issues/3) (see for more info).

Home Assistant calculates the statistical data. The `statistics-graph` card uses the same API, hence why this card has similar configuration. The statistics will be displayed instead of the current state.  The `start_time` is 00:00:00 of the day. The `end_time` is 23:59:59 of the day.

The statistics only support `sensors` with `state_class` of `measurement`, `total` or `total_increasing`.

- `statistics` is a boolean. If set to true, the card will display the statistics instead of the current state.

- `statistics_day_offset` is the number of days into the past. It has to be a whole positive integer. The default is 1 day.

- `statistics_period` is the period on which the statistics are calculated (the average of the whole day or each hour). The default is `hour`. The options are `5minute`, `hour`, `day`, `week`, `month`.

- `statistics_function` is the function used to calculate the statistics. The default is `mean`. The options are `change`, `max`, `mean`, `min`, `state`, `sum`.

Some entities only support `mean`, `min` and `max` (For example `sensor.plug_1_power` - state_class: measurement). And some entities only support `change`, `state` and `sum` (For example `sensor.plug_1_summitation_delivered` - state_class: total). A warning will be shown if the entity does not support the selected function: `No statistics found.`.

</div>

</div>

### Some things that should be added in the future:
- [ ] Add a setting to change the position of the legend.
- [ ] Create a better way of selecting the color. (also set the color to auto)
- [ ] Add a setting to change the position of the gauge. (perhaps vertical)

**Thanks to <a href="https://github.com/JonahKr/power-distribution-card">JonahKr/power-distribution-card</a> for the inspiration**

**If you find a Bug or have some suggestions, let me know <a href="https://github.com/Tomer27cz/energy-line-gauge/issues">here</a>! I'm happy about every feedback.** 

**Contributions are welcome!**

**If you like the card, consider starring it.**
