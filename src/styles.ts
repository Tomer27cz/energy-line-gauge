import { css } from 'lit';

// noinspection CssUnresolvedCustomProperty,CssUnusedSymbol,CssInvalidHtmlTagReference
export const configElementStyle = css`
  .card-config {
    /* Cancels overlapping Margins for HAForm + Card Config options */
    overflow: auto;
  }
  ha-switch {
    padding: 16px 6px;
  }
  .side-by-side {
    display: flex;
    align-items: flex-end;
  }
  .side-by-side > * {
    flex: 1;
    padding-right: 8px;
    padding-inline-end: 8px;
    padding-inline-start: initial;
  }
  .side-by-side > *:last-child {
    flex: 1;
    padding-right: 0;
    padding-inline-end: 0;
    padding-inline-start: initial;
  }
  .suffix {
    margin: 0 8px;
  }
  hui-action-editor,
  ha-select,
  ha-textfield,
  ha-icon-picker {
    margin-top: 8px;
    display: block;
  }
  ha-expansion-panel {
    display: block;
    --expansion-panel-content-padding: 0;
    border-radius: 6px;
    --ha-card-border-radius: 6px;
  }
  ha-expansion-panel .content {
    padding: 12px;
  }
  ha-expansion-panel > *[slot="header"] {
    margin: 0;
    font-size: inherit;
    font-weight: inherit;
  }
  ha-expansion-panel ha-svg-icon {
    color: var(--secondary-text-color);
  }
  .back-title {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
  }
  ha-icon {
      display: flex;
  }  
`;

// noinspection CssUnresolvedCustomProperty,CssUnusedSymbol,CssInvalidHtmlTagReference
export const styles = css`
    .line-gauge-card {
        --gauge-card-width: 300px;
        --color: var(--primary-color);
        --background-color: var(--secondary-background-color);

        width: 95%;
        box-sizing:border-box;
        cursor: pointer;
        /*pointer-events: none;*/
        transition: all 0.3s ease-out;

        margin: 2px auto;
        padding: 10px;
    }

    .line-gauge-card div {
        box-sizing:border-box
    }

    .gauge-frame {
        width: 100%;
        display: flex;
        flex-wrap: nowrap;
        flex-grow: 1;
    }
    .gauge-header {
        margin-bottom: 1rem;
    }
    .gauge-title {
        font-size: 2rem;
        text-align: left;
        flex-wrap: nowrap;
        white-space: nowrap;
        margin-bottom: 0.5rem;
    }
    .gauge-subtitle {
        font-size: 1rem;
        text-align: left;
        flex-wrap: nowrap;
        white-space: nowrap;
        color: gray;
    }
    
    /* Gauge Value -------------------------------------------*/

    .gauge-value {
        font-size: 2.5rem;
        text-align: center;
        flex-wrap: nowrap;
        white-space: nowrap;
    }
    .unit {
        font-size: 1.5rem;
        text-align: center;
        flex-wrap: nowrap;
        white-space: nowrap;
        height: 100%;
        color: var(--secondary-text-color);
    }
    
    /* MAIN Label Position -------------------------------------------------- */
    
    /* 'left' | 'right' | 'none' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'; */
    .position-left {
        flex-direction: row;
        align-items: center;
    }

    .position-right {
        flex-direction: row-reverse;
        align-items: center;
    }

    .position-top-left,
    .position-top-middle,
    .position-top-center,
    .position-top-right {
        flex-direction: column;
    }

    .position-bottom-left,
    .position-bottom-middle,
    .position-bottom-center,
    .position-bottom-right {
        flex-direction: column-reverse;
    }

    .position-top-left,
    .position-bottom-left {
        align-items: flex-start;
    }

    .position-top-middle,
    .position-bottom-middle,
    .position-top-center,
    .position-bottom-center {
        align-items: center;
    }

    .position-top-right,
    .position-bottom-right {
        align-items: flex-end;
    }

    /* Gauge value positioning adjustments */
    .position-left .gauge-value {
        margin-right: 1rem;
    }

    .position-right .gauge-value {
        margin-left: 1rem;
    }

    .position-none .gauge-value {
        display: none;
    }

    .position-top-left .gauge-value,
    .position-top-middle .gauge-value,
    .position-top-center .gauge-value,
    .position-top-right .gauge-value {
        margin: 0.5rem 0 1rem 0;
    }

    .position-bottom-left .gauge-value,
    .position-bottom-middle .gauge-value,
    .position-bottom-center .gauge-value,
    .position-bottom-right .gauge-value {
        margin: 1rem 0 0.5rem 0;
    }
    
    /*Gauge line -------------------------------------------*/

    .gauge-line {
        width: 100%;
        height: 3rem;
        background-color: var(--background-color);
    }
    .main-line {
        width: 0;
        height: 100%;
        background-color: var(--color);
        transition: width 1s ease-out;
    }
    
    .device-line-container {
        display: flex;
        position: relative;
        top: -3rem;
        height: 3rem;
        width: 100%;
    }
    
    /* Device line --------------------------------------------*/

    .device-line {
        float: left;
        height: 100%;
        transition: width 1s ease-out;
        display: flex;
    }
    .device-line-label {
        white-space: nowrap;
        overflow: hidden;
        width: 100%;
        min-width: 0;
        z-index: 1;
        pointer-events: none;
    }
    
    /* Device line label position --------------------------------------------*/
    /* 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center'; */
    
    .line-text-position-left {
        text-align: left;
        align-content: center;
    }
    .line-text-position-right {
        text-align: right;
        align-content: center;
    }
    .line-text-position-center {
        text-align: center;
        align-content: center;
    }
    .line-text-position-top-left {
        text-align: left;
        align-content: start;
    }
    .line-text-position-top-right {
        text-align: right;
        align-content: start;
    }
    .line-text-position-top-center {
        text-align: center;
        align-content: start;
    }
    .line-text-position-bottom-left {
        text-align: left;
        align-content: end;
    }
    .line-text-position-bottom-right {
        text-align: right;
        align-content: end;
    }
    .line-text-position-bottom-center {
        text-align: center;
        align-content: end;
    }
    
    /*Theme  --------------------------------------------------*/
    
    .line-corner-lite_rounded {
        border-radius: 0.25rem;
        overflow: hidden;
    }
    .line-corner-medium_rounded {
        border-radius: 0.5rem;
        overflow: hidden;
    }
    .line-corner-rounded {
        border-radius: 0.75rem;
        overflow: hidden;
    }
    .line-corner-square {
        border-radius: 0;
        overflow: hidden;
    }
    .line-corner-circular {
        border-radius: 1.5rem;
        overflow: hidden;
    }
    
    /*Legend -------------------------------------------------*/

    .chart-legend {
        text-align: center;
    }
    .chart-legend ul {
        display: inline-flex;
        margin: 8px 0 0;
        width: 100%;
        padding-inline-start: 0;
        justify-content: center;
        flex-wrap: wrap;
    }
    .chart-legend li {
        cursor: pointer;
        display: inline-grid;
        grid-auto-flow: column;
        padding: 0 8px;
        box-sizing: border-box;
        align-items: center;
        color: var(--secondary-text-color);
        height: 24px;
    }
    .chart-legend .label {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }
    .chart-legend .bullet {
        border-width: 1px;
        border-style: solid;
        border-radius: 50%;
        display: inline-block;
        height: 16px;
        margin-right: 6px;
        width: 16px;
        direction: var(--direction);
    }
    
    /*Delta -------------------------------------------------*/
    
    .gauge-delta {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
    .gauge-delta-item {
        text-align: center;
        vertical-align: middle;
        flex-wrap: nowrap;
        white-space: nowrap;
        font-size: 0.75rem;
        line-height: 1.5rem;
        color: var(--secondary-text-color);
    }
    .gauge-delta-item span {
        font-size: 1.5rem;
    }
    .delta span {
        font-size: 1.5rem;
        color: var(--primary-text-color);
    }
`;