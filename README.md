# Energy Line Gauge
[![GitHub package.json version](https://img.shields.io/github/package-json/v/Tomer27cz/energy-line-gauge)](https://github.com/Tomer27cz/energy-line-gauge/blob/master/package.json)
![Maintained](https://img.shields.io/maintenance/yes/2025)
![Validate HACS](https://img.shields.io/github/actions/workflow/status/Tomer27cz/energy-line-gauge/.github/workflows/validate-hacs.yaml?label=Validate%20HACS)
[![GitHub license](https://img.shields.io/github/license/Tomer27cz/energy-line-gauge)](https://img.shields.io/github/license/Tomer27cz/energy-line-gauge/blob/master/LICENSE)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/custom-components/hacs)
![GitHub Repo stars](https://img.shields.io/github/stars/Tomer27cz/energy-line-gauge?style=flat)
![GitHub issues](https://img.shields.io/github/issues/Tomer27cz/energy-line-gauge?style=flat)
![GitHub Issues or Pull Requests](https://img.shields.io/github/issues-pr/Tomer27cz/energy-line-gauge)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/Tomer27cz/energy-line-gauge/total)
![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/Tomer27cz/energy-line-gauge/latest/total)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/Tomer27cz/energy-line-gauge)

<a href="https://www.buymeacoffee.com/tomer27" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 50px; width: auto; cursor: pointer;" />
</a>

<h1 align="center">A line Gauge with a focus on Energy Usage</h1>
<p align="center">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/main.png" alt="Main Image"/>
</p>

<p align="center">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/only_gauge.png" alt="Only Gauge"/>
</p>

The main idea of this card is to show the energy consumption of your devices as a percentage of the **main entity** (your entity for tracking whole **house consumption**).

The card is designed to resemble the Home Assistant **Energy panel** style. The **auto color** option will use the colors in the same order as the energy panel.


<!-- toc -->

<div id="table-of-contents">
<h1>Table of Contents</h1>

* [Energy Line Gauge](#energy-line-gauge)
* [Installation](#installation)
    * [Installation via HACS](#installation-via-hacs)
    * [Manual installation](#manual-installation)
* [Configuration](#configuration)
    * [Visual Editor](#visual-editor)
    * [YAML Only](#yaml-only)
    * [Main Options](#main-options)
    * [Types](#types)
    * [Entities](#entities)
* [Examples](#example)
    * [Icons in the legend](#icon)
    * [Only Line](#legend_hide)
    * [Delta](#delta)
    * [Legend with all entities](#legend_all)
    * [Normal usage](#normal-usage--how-i-use-it-)
    * [Position (Text & Title Placement)](#position)
    * [Legend (Layout & Alignment)](#legend)
    * [Theme (Corner Styles)](#theme)
    * [Style (Text Styling)](#style)
    * [Overflow (Text Overflow Handling)](#overflow)
* [State Content](#state_content)
    * [Untracked State Content](#untracked_state_content)
* [Offset](#offset)
* [Statistics](#statistics)


* [Issues](#issues)
* [Contribute](#contribute)

</div>

<div id="installation">
<h1>Installation</h1>

<a href="https://my.home-assistant.io/redirect/hacs_repository/?owner=Tomer27cz&amp;repository=energy-line-gauge&amp;category=plugin" target="_blank" rel="noreferrer noopener"><img src="https://my.home-assistant.io/badges/hacs_repository.svg" alt="Open your Home Assistant instance and open a repository inside the Home Assistant Community Store."></a>

<div id="installation-via-hacs">
<h2> Installation via <a href="https://hacs.xyz/">HACS</a><img src="https://img.shields.io/badge/-Recommended-%2303a9f4" alt=""/></h2>

1. Make sure the [HACS](https://github.com/custom-components/hacs) custom component is installed and working.
2. Search for `energy-line-gauge` and add it through HACS
3. Refresh home-assistant.
4. 
</div>

<div id="manual-installation">
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
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/editor_v2-2-2.png" alt="Visual Editor"/>
</p>

<hr/>

## YAML Only

Some features are not yet available in the Visual Editor. For example the ability to set `min` and `max` to be an entity or color `auto`.
```yaml
type: 'custom:energy-line-gauge'
entity: sensor.glow_power_consumption

title: Power Consumption
subtitle: Glow

title_position: top-left
title_text_size: 2
title_text_style: shadow-light

min: 0
max: sensor.glow_power_consumption

precision: 0
unit: W
cutoff: 5
offset: 1d

position: left
text_size: 2.5
text_style: weight-bold

corner: 'square'
state_content_separator: '|'

color: "#00aafa"
color_bg:
    - 40
    - 40
    - 40

line_text_position: 'bottom-right'
line_text_size: 1.5
line_text_style: shadow-medium
line_text_overflow: fade
overflow_direction: right

tap_action:
  action: more-info
  entity: sensor.glow_power_consumption
hold_action:
  action: none
double_tap_action:
  action: none

legend_hide: false
legend_all: false

legend_position: bottom-center
legend_alignment: center
legend_indicator: icon-fallback
legend_text_size: 1
legend_text_style: italic

show_delta: false
delta_position: bottom-center

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
    legend_indicator: '-'
  - entity: sensor.plug_1_power
    name: Plug 1
    color:
      - 244
      - 189
      - 74
```

<hr/>

## Main Options

There are a lot of settings you can customize your sensors with:

| Setting                        |         type          |           default            |                                         example                                          | description                                                                                                                                |
|--------------------------------|:---------------------:|:----------------------------:|:----------------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------|
| `entity`                       |       entityID        |         *!required*          |                                       sensor.power                                       | You can specify the entity_id here as well.                                                                                                |
| `title`                        |        string         |            *none*            |                                    Power Consumption                                     | The title of the Card (font_size: 2rem)                                                                                                    |
| `subtitle`                     |        string         |            *none*            |                                           Glow                                           | Text in gray below the title (font_size: 1rem)                                                                                             |
| `title_position`               |     PositionType      |          `top-left`          |                                           left                                           | Position of the title [see examples](#position)                                                                                            |
| `title_text_size`              |        number         |             `2`              |                                           1.5                                            | Font size of the title, subtitle is 2x smaller.                                                                                            |
| `title_text_style`             |     TextStyleType     |            *none*            |                                        ['italic']                                        | Text style of the Title ans Subtitle [see examples and hierarchy](#style)                                                                  |
| `min`                          |  number or entityID   |             `0`              |                                           100                                            | The minimum value of the gauge. Can be an entity_id.                                                                                       |
| `max`                          |  number or entityID   |           *entity*           |                                       sensor.power                                       | The maximum value of the gauge. Can be an entity_id.                                                                                       |
| `precision`                    |        number         |             `0`              |                                            2                                             | The number of decimals to display.                                                                                                         |
| `unit`                         |        string         |            *none*            |                                            W                                             | This string will be appended to the end of the value.                                                                                      |
| `cutoff`                       |        number         |             `0`              |                                            10                                            | Any entity with a value below or equal to this will not be displayed or counted.                                                           |
| `offset`                       |        string         |            *none*            |                                            1d                                            | Offset state into the past [see more](#offset).                                                                                            |
| `corner`                       |      CornerType       |           `square`           |                                         circular                                         | The theme (shape) of the gauge [see examples](#theme)                                                                                      |
| `state_content_separator`      |        string         |           `' ⸱ '`            |                                           '-'                                            | This string is added between state content items in legend and line.                                                                       |
| `position`                     |     PositionType      |            `left`            |                                           none                                           | Position of the main label [see examples](#position)                                                                                       |
| `text_size`                    |        number         |            `2.5`             |                                            2                                             | Font size of the main value (in rem).                                                                                                      |
| `text_style`                   |     TextStyleType     |            *none*            |                                     ['weight-bold']                                      | Text style of the Value [see examples and hierarchy](#style)                                                                               |
| `line_text_position`           |   LinePositionType    |            `left`            |                                       bottom-right                                       | Position of the state content in the line [see examples](#untracked_state_content)                                                         |
| `line_text_size`               |        number         |             `1`              |                                           1.5                                            | Font size of the state content in the line (in rem)                                                                                        |
| `line_text_style`              |     TextStyleType     |            *none*            |                                     ['shadow-hard']                                      | Text style of the State content inside the Line [see examples and hierarchy](#style)                                                       |
| `line_text_overflow`           |   TextOverflowType    |          `tooltip`           |                                           fade                                           | What happens when the text in the line overflows [see examples](#overflow)                                                                 |
| `overflow_direction`           | OverflowDirectionType |                              |                                                                                          |                                                                                                                                            |
| `color`                        |       ColorType       |       *primary-color*        |                                         #00aafa                                          | The color of the gauge. And the untracked legend.                                                                                          |
| `color_bg`                     |       ColorType       | *secondary-background-color* |                                       [40, 40, 40]                                       | The background color of the gauge. Only visible if the gauge is not filled (max is entity).                                                |
| `tap_action`                   |     Action Config     |         *more-info*          | [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables) | Single tap action for item.                                                                                                                |
| `hold_action`                  |     Action Config     |         *more-info*          | [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables) | Hold action for item.                                                                                                                      |
| `double_tap_action`            |     Action Config     |            *none*            | [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables) | Double tap action for item.                                                                                                                |
| `legend_hide`                  |         bool          |           `false`            |                                           true                                           | This will hide the legend = only line visible. [example](#legend_hide)                                                                     |
| `legend_all`                   |         bool          |           `false`            |                                          false                                           | Display all the entities regardless of the cutoff. (does not affect gauge) [example](#legend_all)                                          |
| `legend_position`              |     PositionType      |       `bottom-center`        |                                          right                                           | Position of the legend [see examples](#legend)                                                                                             |
| `legend_alignment`             |     AlignmentType     |           `center`           |                                      space-between                                       | Alignment of the legend items [see examples](#legend)                                                                                      |
| `legend_indicator`             |     IndicatorType     |       `icon-fallback`        |                                          circle                                          | What indicator will be left of the text in the legend.                                                                                     |
| `legend_text_size`             |        number         |             `1`              |                                           1.5                                            | Font size of the legend text (in rem) - not including icon                                                                                 |
| `legend_text_style`            |     TextStyleType     |            *none*            |                                    ['black-outline']                                     | Text style of the legend text [see examples and hierarchy](#style)                                                                         |
| `show_delta`                   |         bool          |           `false`            |                                           true                                           | Show the state, sum and delta of all the devices in respect to the main entity. [example](#delta)                                          |
| `delta_position`               |     PositionType      |       `bottom-center`        |                                        top-center                                        | Position of delta around value and line                                                                                                    |
| `untracked_legend`             |         bool          |            `true`            |                                          false                                           | Show the legend for untracked consumption.                                                                                                 |
| `untracked_legend_label`       |        string         |   `Untracked consumption`    |                                        Untracked                                         | The label for the untracked legend. (default is translated)                                                                                |
| `untracked_legend_icon`        |        string         |            *none*            |                                        mdi:flash                                         | Display an icon instead of the colored circle. (icon will also be colored)                                                                 |
| `untracked_state_content`      | UntrackedStateContent |          `['name']`          |                                        ['state']                                         | What info will be shown after the circle or icon. Order matters. Info will be separated by a dot. [see examples](#untracked_state_content) |
| `untracked_line_state_content` | UntrackedStateContent |            *none*            |                                      ['percentage']                                      | Info will be shown in the line. Order matters. Info will be separated by a dot. [see examples](#untracked_state_content)                   |
| `suppress_warnings`            |         bool          |           `false`            |                                           true                                           | Do not show the warnings, such as "Entity unavailable" or "Entity not found"                                                               |
| `statistics`                   |         bool          |           `false`            |                                           true                                           | Enable the statistic data. Data from statistic will be displayed instead of current state [see more](#statistics).                         |
| `statistics_day_offset`        |        number         |             `1`              |                                            7                                             | Whole number of days into the past.                                                                                                        |
| `statistics_period`            |   StatisticsPeriod    |            `hour`            |                                           day                                            | Statistical period [see more](#statistics).                                                                                                |
| `statistics_function`          |  StatisticsFunction   |            `mean`            |                                           max                                            | Statistical function [see more](#statistics).                                                                                              |
| `entities`                     |       Entities        |            *none*            |                                    (Example in yaml)                                     | The list of entities. Config [here.](#entities)                                                                                            |

### Types

<div id="types">

The types are used in the configuration. The type is used to define what kind of data is expected.

|         Type          | description                                                                                                                                                                                                                                                                                                                                                         |
|:---------------------:|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|        string         | A string of characters (text)                                                                                                                                                                                                                                                                                                                                       |
|        number         | A number.                                                                                                                                                                                                                                                                                                                                                           |
|         bool          | `true` or `false`                                                                                                                                                                                                                                                                                                                                                   |
|       entityID        | String containing an entity id. Example: `sensor.plug_1_power`                                                                                                                                                                                                                                                                                                      |
|     PositionType      | Single: `left`, `right`, `none`, `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`                                                                                                                                                                                                                                              |
|   LinePositionType    | Single: `left`, `right`, `none`, `center`, `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`                                                                                                                                                                                                                                    |
|      CornerType       | Single: `square`, `lite-rounded`, `medium-rounded`, `rounded`, `circular`                                                                                                                                                                                                                                                                                           |
|     AlignmentType     | Single: `left`, `right`, `center`, `space-around`, `space-between`, `space-evenly`                                                                                                                                                                                                                                                                                  |
|     TextStyleType     | Array of any: `weight-lighter`, `weight-bold`, `weight-bolder`, `style-italic`, `decoration-underline`, `decoration-overline`, `decoration-line-through`, `transform-uppercase`, `transform-lowercase`, `transform-capitalize`, `family-monospace`, `shadow-light`, `shadow-medium`, `shadow-heavy`, `shadow-hard`, `shadow-neon`, `black-outline`, `white-outline` |
|   TextOverflowType    | Single: `ellipsis`, `clip`, `tooltip`, `tooltip-segment`, `fade`                                                                                                                                                                                                                                                                                                    |
| OverflowDirectionType | Single: `left`, `right`                                                                                                                                                                                                                                                                                                                                             |
|       ColorType       | An array of three numbers (RGB), HEX string or `auto`.                                                                                                                                                                                                                                                                                                              |
|     ActionConfig      | Event cased by an Action. See more [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables)                                                                                                                                                                                                                                         |
| UntrackedStateContent | Array of any: `state`, `name`, `percentage`                                                                                                                                                                                                                                                                                                                         |
|   StatisticsPeriod    | Single: `5minute`, `hour`, `day`, `week`, `month`                                                                                                                                                                                                                                                                                                                   |
|  StatisticsFunction   | Single: `max`, `mean`, `min`, `state`, `sum`, `change`                                                                                                                                                                                                                                                                                                              |
|     IndicatorType     | Single: `circle`, `icon`, `icon-fallback`, `none`                                                                                                                                                                                                                                                                                                                   |
|     StateContent      | Array of any: `state`, `name`, `last_changed`, `last_updated`, `percentage`, `icon`                                                                                                                                                                                                                                                                                 | 

</div>

## Entities

<div id="entities">

<p align="center">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/editor_entity_v2-2-1.png" alt="Visual Editor Entity"/>
</p>

The only required field is `entity`. The rest of the fields are optional. Color `auto` can only be set in the YAML file (or it will be set to `auto` by default when creating the card).

#### Each entity has its own settings:

| Setting              |     type      |     default      |                                         example                                          | description                                                                                                                                          |
|----------------------|:-------------:|:----------------:|:----------------------------------------------------------------------------------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------------|
| `entity`             |   entityID    |   *!required*    |                                   sensor.plug_0_power                                    | You can specify the entity_id here as well.                                                                                                          |
| `name`               |    string     |      *none*      |                                          Plug 0                                          | The name of the entity to be displayed in the legend.                                                                                                |
| `icon`               |    string     |      *none*      |                                        mdi:flash                                         | Display an icon instead of the colored circle. (icon will also be colored) [example](#icon)                                                          |
| `color`              |   ColorType   |      `auto`      |                                           auto                                           | The color of the gauge and legend. (auto: Home Assistant Energy panel - the same order)                                                              |
| `cutoff`             |    number     |  *main cutoff*   |                                            10                                            | Any entity with a value below this will not be displayed.                                                                                            |
| `unit`               |    string     |  *entity unit*   |                                            kW                                            | String that is added to the end of entity state.                                                                                                     |
| `multiplier`         |    number     |       `1`        |                                          0.001                                           | Entity state will be multiplied by this number. Useful when you have entities in kW and W. Automatically set (adjusts to be the same as main entity) |
| `precision`          |    number     | *main precision* |                                            1                                             | Will override main precision pre entity.                                                                                                             |
| `state_content`      | StateContent  |    `['name']`    |                                    ['name', 'state']                                     | State content in the legend. Order matters. Info will be separated by a dot.                                                                         |
| `line_state_content` | StateContent  |      *none*      |                                 ['percentage', 'state']                                  | State content in the line. Order matters. Info will be separated by a dot.                                                                           |
| `legend_indicator`   | IndicatorType | `icon-fallback`  |                                          circle                                          | What indicator will be left of the text in the legend.                                                                                               |
| `tap_action`         | Action Config |   *more-info*    | [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables) | Single tap action for item.                                                                                                                          |
| `hold_action`        | Action Config |   *more-info*    | [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables) | Hold action for item.                                                                                                                                |
| `double_tap_action`  | Action Config |      *none*      | [Configuration](https://www.home-assistant.io/lovelace/actions/#configuration-variables) | Double tap action for item.                                                                                                                          |
<p>

</div>

</div>

<hr/>

<div id="example">

## Examples

### Icons in the legend

<div id="icon">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/examples/icons.png" alt="Icons in the Legend">

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
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/examples/only_line_entities.png" alt="Only Line Entities">

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/examples/only_line_max.png" alt="Only Line Max">

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

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/examples/delta.png" alt="Delta">

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
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/examples/legend_all.png" alt="Legend All Entities">

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

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/examples/normal.png" alt="Normal Usage">

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
untracked_legend: true
untracked_legend_label: Untracked
```

<div id="position">

## Position

<hr/>

### `position: none` `title_position: none` `legend_position: none` `line_text_position: none`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/none.png" alt="none">

### `position: left` `title_position: left`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/left.png" alt="left">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/title_position/left.png" alt="left">

### `position: right` `title_position: right`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/right.png" alt="right">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/title_position/right.png" alt="right">

### `position: top-left` `title_position: top-left`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/top-left.png" alt="top-left">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/title_position/top-left.png" alt="top-left">

### `position: top-center` `title_position: top-center`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/top-center.png" alt="top-center">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/title_position/top-center.png" alt="top-center">

### `position: top-right` `title_position: top-right`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/top-right.png" alt="top-right">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/title_position/top-right.png" alt="top-right">

### `position: bottom-left` `title_position: bottom-left`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/bottom-left.png" alt="bottom-left">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/title_position/bottom-left.png" alt="bottom-left">

### `position: bottom-center` `title_position: bottom-center`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/bottom-center.png" alt="bottom-center">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/title_position/bottom-center.png" alt="bottom-center">

### `position: bottom-right` `title_position: bottom-right`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/position/bottom-right.png" alt="bottom-right">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/title_position/bottom-right.png" alt="bottom-right">

## Legend

<div id="legend">

### `legend_position: left` `legend_alignment: center`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/legend_position/left.png" alt="left">

### `legend_position: right` `legend_alignment: center`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/legend_position/right.png" alt="right">

### `legend_position: top-*` `legend_alignment: center`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/legend_position/top.png" alt="top">

### `legend_position: bottom-*` `legend_alignment: center`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/legend_position/bottom.png" alt="bottom">

### Legend Alignment

### `legend_alignment: left`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/legend_alignment/left.png" alt="left">

### `legend_alignment: right`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/legend_alignment/right.png" alt="right">

### `legend_alignment: center`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/legend_alignment/center.png" alt="center">

### `legend_alignment: space-around`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/legend_alignment/space-around.png" alt="space-around">

### `legend_alignment: space-between`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/legend_alignment/space-between.png" alt="space-between">

### `legend_alignment: space-evenly`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/legend_alignment/space-evenly.png" alt="space-evenly">


</div>
</div>

<div id="theme">

## Theme

<hr/>

### `corner: square`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/theme/square.png" alt="square">

### `corner: lite-rounded`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/theme/lite-rounded.png" alt="lite-rounded">

### `corner: medium-rounded`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/theme/medium-rounded.png" alt="medium-rounded">

### `corner: rounded`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/theme/rounded.png" alt="rounded">

### `corner: circular`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/theme/circular.png" alt="circular">

<div id="style">

## Style

### `weight-bolder` → `weight-bold` → `weight-lighter`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/weight-bolder.png" alt="weight-bolder">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/weight-bold.png" alt="weight-bold">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/weight-lighter.png" alt="weight-lighter">

### `style-italic`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/style-italic.png" alt="style-italic">

### `decoration-underline` `decoration-overline` `decoration-line-through`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/decoration-underline.png" alt="decoration-underline">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/decoration-overline.png" alt="decoration-overline">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/decoration-line-through.png" alt="decoration-line-through">

### `transform-uppercase` → `transform-lowercase` → `transform-capitalize`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/transform-uppercase.png" alt="transform-uppercase">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/transform-lowercase.png" alt="transform-lowercase">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/transform-capitalize.png" alt="transform-capitalize">

### `family-monospace`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/family-monospace.png" alt="family-monospace">

### `shadow-neon` → `shadow-hard` → `shadow-heavy` → `shadow-medium` → `shadow-light`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/shadow-neon.png" alt="shadow-neon">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/shadow-hard.png" alt="shadow-hard">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/shadow-heavy.png" alt="shadow-heavy">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/shadow-medium.png" alt="shadow-medium">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/shadow-light.png" alt="shadow-light">

### `black-outline` → `white-outline`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/black-outline.png" alt="black-outline">
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/text_style/white-outline.png" alt="white-outline">

</div>

<div id="overflow">

## Overflow

### `line_text_overflow: ellipsis`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/overflow/ellipsis.png" alt="ellipsis">

### `line_text_overflow: clip`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/overflow/clip.png" alt="clip">

### `line_text_overflow: fade`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/overflow/fade.png" alt="fade">

### `line_text_overflow: tooltip`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/overflow/tooltip.png" alt="tooltip">

### `line_text_overflow: tooltip-segment`
Each of the state content parts will disappear one by one when the text is too long. The first part will be removed, then the second part and so on.

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/overflow/tooltip-segment.png" alt="tooltip-segment">

## Overflow Direction

### `line_text_overflow_direction: right`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/overflow/fade.png" alt="fade">

### `line_text_overflow_direction: left`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/overflow/fade-direction-left.png" alt="fade">


</div>

</div>

## State Content

<div id="state_content">
The state content is the text displayed in the legend and the line. You can choose what to display and in which order.  The order in the config matters. The text will be separated by a dot.

The position of the text in the line is set by `line_text_position`. Options are `left`, `right`, `none`, `center`, `top-left`, `top-right`, `top-center`, `bottom-left`, `bottom-right`, `bottom-center`.

| Option         | description                                                  |    Example    |
|----------------|--------------------------------------------------------------|:-------------:|
| `name`         | Specified in config or if not the `friendly_name` attribute. |    Plug 1     |
| `state`        | The state of the entity, with the `unit` added at the end.   |     158 W     |
| `last_changed` | The last time the entity changed state.                      | 6 seconds ago |
| `last_updated` | The last time the entity was updated.                        | 6 seconds ago |
| `percentage`   | The percentage of the entity in respect to the main entity.  |      55%      |
| `icon`         | Specified in config or if not the `icon` attribute.          | mdi:lightbulb |

<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/examples/state_content.png" alt="State Content">

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

<div id="untracked_state_content">

### Untracked State Content

| Option         | description                                                                                       |  Example  |
|----------------|---------------------------------------------------------------------------------------------------|:---------:|
| `name`         | Specified in config or `Untracked consumption`(translated).                                       | Untracked |
| `state`        | Main entity state minus sum of device states, with the `unit` added at the end. (can be negative) |   -15 W   |
| `percentage`   | One hundred minus the sum of device widths                                                        |    3%     |


<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/examples/untracked_state_content.png" alt="Untracked State Content">

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

### `line_text_position: *` `line_text_size: 1.5`
<img src="https://github.com/Tomer27cz/energy-line-gauge/raw/main/.github/img/line_text_position/3-3-line-text.png" alt="line_text_position">

|  `top-left`   |  `top-center`   |  `top-right`   |
|:-------------:|:---------------:|:--------------:|
|    `left`     |    `center`     |    `right`     |
| `bottom-left` | `bottom-center` | `bottom-right` |




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

The statistics only support `sensors` with state_class of `measurement`, `total` or `total_increasing`.

- `statistics` is a boolean. If set to true, the card will display the statistics instead of the current state.

- `statistics_day_offset` is the number of days into the past. It has to be a whole positive integer. The default is 1 day.

- `statistics_period` is the period on which the statistics are calculated (the average of the whole day or each hour). The default is `hour`. The options are `5minute`, `hour`, `day`, `week`, `month`.

- `statistics_function` is the function used to calculate the statistics. The default is `mean`. The options are `change`, `max`, `mean`, `min`, `state`, `sum`.

Some entities only support `mean`, `min` and `max` (For example `sensor.plug_1_power` - state_class: measurement). And some entities only support `change`, `state` and `sum` (For example `sensor.plug_1_summitation_delivered` - state_class: total). A warning will be shown if the entity does not support the selected function: `No statistics found.`.

</div>

</div>

<div id="issues">

## Issues / Feedback / Suggestions

If you find a bug or have a suggestion, please let me know on the [GitHub issues page](https://github.com/Tomer27cz/energy-line-gauge/issues). I am happy about every feedback and will try to fix the issue as soon as possible.

</div>

<div id="contribute">

## Contribute

If you want to contribute to the project, you can do so by forking the repository and creating a pull request. I am happy about every contribution, whether it is a bug fix, a new feature or a documentation improvement.

</div>
<hr/>

## **All contributions are welcome!**

## **If you like the card, consider ⭐ starring it.**
