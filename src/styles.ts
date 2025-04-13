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
`;

// noinspection CssUnresolvedCustomProperty,CssUnusedSymbol,CssInvalidHtmlTagReference
export const styles = css`
    .line-gauge-card {
        --gauge-card-width: 300px;
        --color: var(--primary-color);
        --background-color: var(--secondary-background-color);

        width: 90%;
        box-sizing:border-box;
        cursor: pointer;
        /*pointer-events: none;*/
        transition: all 0.3s ease-out;

        margin: 6px auto;
        padding: 16px;
    }

    .line-gauge-card div {
        box-sizing:border-box
    }

    .gauge-frame {
        width: 100%;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        flex-grow: 1;
        justify-content: center;
        align-items: center;
    }

    .gauge-value {
        font-size: 2.5rem;
        text-align: center;
        flex-wrap: nowrap;
        white-space: nowrap;
    }
    .gauge-label {
        margin-top: 1rem;
        font-size: 1.5rem;
        text-align: center;
        flex-wrap: nowrap;
        white-space: nowrap;
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

    .gauge-line {
        width: 100%;
        height: 3rem;
        margin-left: 1rem;
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
    .device-line {
        float: left;
        width: var(--line-width);
        height: 100%;
        background-color: var(--color);
        transition: width 1s ease-out;
    }
    
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
    ha-icon {
        width: 24px;
        height: 24px;
        --mdc-icon-size: 24px;
        display: inline-flex;
        margin-right: 4px;
    }
`;