import { css } from 'lit-element';

export default css`
  protvista-tooltip a {
    text-decoration: underline;
    color: #fff;
  }
  .track-content {
    width: 80vw;
  }

  .nav-container,
  .category__track {
    display: flex;
    margin-bottom: 0.1rem;
  }

  .category {
    display: none;
    margin-bottom: 0.1rem;
  }

  .category-label,
  .track-label,
  .action-buttons,
  .credits {
    width: 20vw;
    padding: 0.5em;
  }

  .action-buttons {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
  }

  .category-label {
    background-color: #b2f5ff;
    cursor: pointer;
  }

  .category-label::before {
    content: ' ';
    display: inline-block;
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 5px solid #333;
    margin-right: 5px;
    -webkit-transition: all 0.1s;
    /* Safari */
    -o-transition: all 0.1s;
    transition: all 0.1s;
  }

  .category-label.open::before {
    content: ' ';
    display: inline-block;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #333;
    margin-right: 5px;
  }

  .track-label {
    background-color: #d9faff;
  }

  protvista-track {
    border-top: 1px solid #d9faff;
  }

  .feature {
    cursor: pointer;
  }
`;
