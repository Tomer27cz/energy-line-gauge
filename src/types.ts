import { ActionConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'energy-line-gauge-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}


// type: custom:line-gauge-card
//
// entity: sensor.glow_power_consumption (main power consumption)
//
// devices:
// 	- entity: sensor.mini_switch_1_power
// 	  lower_cutoff: 5 (if the number is below this => dont show) - override main
// 	  name: "Boiler"
// 	  icon: "mdi:flash" (icon selector)
// 	  color: #9c6b4e (hex code)
//
//
//
// min: 1
// max: 3860 (set to null for devices proportional to main power consumption)
// accuracy: 0 (decimal points)
// lower_cutoff: 5 (if the number is below this => dont show)
//
// font_size: 2 (rem)
// corner: {square - lite_rounded - rounded - circular}
//
// color: #9c6b4e (hex code - color of the line (defaults to --primary-color))
// background-color:
//
// untracked_legend: true (display legend for untracked consumption)
// untracked_legend_name: "Zbytek"
//
// legend: true (display the legend)
// legend_all: false (do not hide any legends (but hide line))
//
// unit: W
// title: Boiler
// subtitle: ""
// label: ""
//
// grid_options:
//   columns: full
//   rows: auto



// const schema = [
//       {
//         name: "entity",
//         required: true,
//         selector: { entity: { domain: "sensor" } },
//       },
//       {
//         name: "",
//         type: "grid",
//         schema: [
//           { name: "name", required: false, selector: { text: {} } },
//           { name: "unit", required: false, selector: { text: {} } }
//         ]
//       },
//       {
//         name: "",
//         type: "grid",
//         schema: [
//           { name: "min", required: false, selector: { number: {} }},
//           { name: "max", required: false, selector: { number: {} }},
//           {
//             name: "accuracy",
//             required: false,
//             selector: {
//               select: {
//                 options: precision_array
//               }
//             }
//           },
//
//         ]
//       },
//       {
//         name: "",
//         type: "expandable",
//         title: this.hass.localize(
//           "ui.panel.lovelace.editor.card.tile.appearance"
//         ),
//         schema: [
//           {
//             name: "",
//             type: "grid",
//             schema: [
//               { name: "title", required: false, selector: { text: {} } },
//               { name: "subtitle", required: false, selector: { text: {} } }
//             ]
//           },
//           {
//             name: "",
//             type: "grid",
//             schema: [
//               { name: "font_size", required: false, selector: { number: { min: 0.01, step: 0.01} } },
//               { name: "corner", required: false, selector:
//                 {
//                   select: {
//                     options: [
//                       {value: "square", label: "Square"},
//                       {value: "lite_rounded", label: "Lite Rounded"},
//                       {value: "rounded", label: "Rounded"},
//                       {value: "circular", label: "Circular"},
//                       {value: "circular", label: "Circular"},
//                       {value: "circular", label: "Circular"},
//                     ]
//                   }
//                 }
//               },
//               { name: "lower_cutoff", required: false, selector: { number: {} } },
//               { name: "color", required: false, selector: { color: {} } },
//               { name: "background_color", required: false, selector: { color: {} } },
//             ],
//           },
//           {
//             name: "",
//             type: "grid",
//             schema: [
//               { name: "show_current", selector: { boolean: {} } },
//               { name: "show_details", selector: { boolean: {} } },
//               { name: "show_graph", selector: { boolean: {} } },
//               { name: "show_info", selector: { boolean: {} } },
//               { name: "show_only_today", selector: { boolean: {} } },
//               { name: "graph_baseline_zero", selector: { boolean: {} } },
//             ],
//           },
//         ],
//       },
//       {
//         name: "devices",
//         type: "array",
//         // add_text: "Add device",
//         // allow_add: true,
//         required: false,
//         schema: [
//           {
//             name: "entity1",
//             required: true,
//             selector: { entity: { domain: "sensor" } },
//           },
//           {
//             name: "name1",
//             required: false,
//             selector: { text: {} },
//           },
//           // {
//           //   name: "color",
//           //   required: false,
//           //   selector: { color: {} },
//           // },
//           {
//             name: "lower_cutoff1",
//             required: false,
//             selector: { number: {} },
//           },
//         ],
//       }
//     ];



export interface EnergyLineGaugeDeviceConfig {
    entity: string;
    name?: string;
    lower_cutoff?: number;
    icon?: string;
    color?: string;
}

// TODO Add your configuration elements here for type-checking
export interface EnergyLineGaugeConfig extends LovelaceCardConfig {
  type: string;
  entity: string;

  // grid
  name?: string;
  unit?: string;

  // grid
  min?: number | null;
  max?: number | null;
  accuracy?: number;

  // Appearance ---
  // grid
  title?: string;
  subtitle?: string;

  // grid
  header?: string;
  label?: string;

  // grid
  font_size?: number;
  corner?: string;
  lower_cutoff?: number;
  color?: string;
  background_color?: string;

  devices: EnergyLineGaugeDeviceConfig[] | null;

  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}
