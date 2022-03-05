import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DoCheck,
  ElementRef,
  forwardRef,
  Inject,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import {
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  EditorView,
  DecorationSet,
  Decoration,
} from '@codemirror/view';
import {
  Compartment,
  EditorState,
  Extension,
  StateEffect,
  StateField,
} from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { highlightActiveLineGutter, lineNumbers } from '@codemirror/gutter';
import {
  autocompletion,
  Completion,
  completionKeymap,
  CompletionContext,
} from '@codemirror/autocomplete';
import {
  defaultHighlightStyle,
  HighlightStyle,
  tags,
} from '@codemirror/highlight';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { defaultKeymap } from '@codemirror/commands';
import { commentKeymap } from '@codemirror/comment'; // Enables Commenting/UnCommenting based on lang
import { javascript } from '@codemirror/lang-javascript';
import { history, historyKeymap } from '@codemirror/history';
import { foldGutter, foldKeymap } from '@codemirror/fold';
import { indentOnInput } from '@codemirror/language';
import { rectangularSelection } from '@codemirror/rectangular-selection';
import { lintKeymap } from '@codemirror/lint';
import { Tooltip, hoverTooltip } from '@codemirror/tooltip';

// compartments is required to make config dynamic
let compartment = new Compartment();
/**
 * inserts custom suggestion to the autocomplete
 * ref: https://codemirror.net/6/examples/autocompletion/
 * @param context
 * @returns
 */
function customCodeCompletion(context: CompletionContext): {
  from: number;
  options: Completion[];
} {
  let word = context.matchBefore(/\w*/);
  if (word?.from == word?.to && !context.explicit)
    return { from: 0, options: [] };

  return {
    from: word?.from || 0,
    options: [
      { label: 'return', type: 'keyword' },
      { label: 'None', type: 'keyword' },
      {
        label: 'annual_income',
        detail: 'Application: Annual Income',
        type: 'variable',
        info: 'Fico Version 1',
      },
      {
        label: 'fico',
        detail: 'Application: Annual Income',
        type: 'variable',
        info: 'Fico Version 1',
      },
      {
        label: 'fico1',
        detail: 'Application: Annual Income',
        type: 'variable',
        info: 'Fico Version 1',
      },
      {
        label: 'fico2',
        detail: 'Application: Annual Income',
        type: 'variable',
        info: 'Fico Version 1',
      },
      {
        label: 'fico3',
        detail: 'Application: Annual Income',
        type: 'variable',
        info: 'Fico Version 1',
      },
      { label: 'age', type: 'input', info: 'Age Version 1' },
    ],
  };
}

/**
 * Selected Item Tooltip
 */
export const wordHover = hoverTooltip((view, pos, side) => {
  let { from, to, text } = view.state.doc.lineAt(pos);
  let start = pos,
    end = pos;
  while (start > from && /\w/.test(text[start - from - 1])) start--;
  while (end < to && /\w/.test(text[end - from])) end++;
  if ((start == pos && side < 0) || (end == pos && side > 0)) return null;
  return {
    pos: start,
    end,
    above: true,
    create(view) {
      let dom = document.createElement('div');
      dom.textContent = text.slice(start - from, end - from);
      return { dom };
    },
  };
});

const colors = {
  text: '#adbac7',
  bg: '#22272e',
  guttersBg: '#22272e',
  guttermarkerText: '#22272e',
  guttermarkerSubtleText: '#636e7b',
  linenumberText: '#768390',
  cursor: '#cdd9e5',
  selectionBg: 'rgba(108,182,255,0.3)',
  activelineBg: '#2d333b',
  matchingbracketText: '#adbac7',
  linesBg: '#22272e',
  syntax: {
    comment: '#768390',
    constant: '#6cb6ff',
    entity: '#dcbdfb',
    keyword: '#f47067',
    storage: '#f47067',
    string: '#96d0ff',
    support: '#6cb6ff',
    variable: '#f69d50',
  },
};

//** Decorations Start */
const addUnderline = StateEffect.define<{ from: number; to: number }>();

const underlineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(underlines, tr) {
    underlines = underlines.map(tr.changes);
    for (let e of tr.effects)
      if (e.is(addUnderline)) {
        underlines = underlines.update({
          add: [underlineMark.range(e.value.from, e.value.to)],
        });
      }
    return underlines;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const underlineMark = Decoration.mark({ class: 'cm-underline' });

const underlineTheme = EditorView.baseTheme({
  '.cm-underline': { textDecoration: 'underline 3px red' },
});

export function underlineSelection(view: EditorView) {
  let effects: StateEffect<unknown>[] = view.state.selection.ranges
    .filter((r) => !r.empty)
    .map(({ from, to }) => addUnderline.of({ from, to }));
  if (!effects.length) return false;

  if (!view.state.field(underlineField, false))
    effects.push(StateEffect.appendConfig.of([underlineField, underlineTheme]));
  view.dispatch({ effects });
  return true;
}

export const underlineKeymap = keymap.of([
  {
    key: 'Mod-h',
    preventDefault: true,
    run: underlineSelection,
  },
]);

//** Decorations End */

const customHighlightStyle = HighlightStyle.define([
  {
    tag: [tags.variableName, tags.derefOperator, tags.separator],
    color: '#000',
    'background-color': '#ccc',
  },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: 'grey',
  },
  {
    tag: [
      tags.definitionKeyword,
      tags.bitwiseOperator,
      tags.logicOperator,
      tags.arithmeticOperator,
      tags.definitionOperator,
      tags.updateOperator,
      tags.compareOperator,
      tags.operatorKeyword,
      tags.punctuation,
      tags.null,
      tags.keyword,
    ],
    color: colors.syntax.keyword,
  },
  {
    tag: [tags.string, tags.special(tags.string)],
    color: colors.syntax.string,
  },

  {
    tag: [tags.regexp],
    color: 'orange',
  },

  { tag: [tags.self], color: 'blue' },
  {
    tag: [tags.number, tags.bool, tags.modifier, tags.atom],
    color: 'blue',
  },
  // {
  //   tag: [
  //     // tags.function(tags.variableName),
  //     tags.function(tags.propertyName),
  //     // tags.typeName,
  //     // tags.labelName,
  //     // tags.className,
  //   ],
  //   color: colors.syntax.entity,
  // },

  { tag: [tags.bracket], color: 'yellow' },
]);

let currentDocValue = StateField.define({
  create() {
    return '';
  },
  update(value, tr) {
    debugger;
    return value;
  },
});

// let state = EditorState.create({ extensions: countDocChanges });
// state = state.update({ changes: { from: 0, insert: '.' } }).state;
// console.log(state.field(countDocChanges)); // 1

export const basicSetup: Extension = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  defaultHighlightStyle.fallback,
  bracketMatching(),
  closeBrackets(),
  // autocompletion(),
  rectangularSelection(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...commentKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),
  underlineKeymap,
  wordHover,
];

const codeCompletion = autocompletion({
  activateOnTyping: true,
  override: [customCodeCompletion],
  maxRenderedOptions: 20,
  optionClass: function (x) {
    return 'className';
  },
  // addToOptions⁠:
});

const themeExtn = EditorView.theme({
  '.cm-content': { color: 'dark' },
  '&.cm-focused .cm-content': { color: 'dark' },
  scroller: {
    'font-family': 'Fira Mono, monospace',
  },
  wrap: {
    border: '1px solid silver',
  },
  searchmatch: {
    background: '#ffa',
  },
});

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit, OnDestroy, DoCheck {
  @ViewChild('ref') ref!: ElementRef<HTMLDivElement>;

  codeMirrorView: EditorView = new EditorView();

  value = '';

  ngAfterViewInit(): void {
    this.codeMirrorView = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          basicSetup,
          // autocompletion(),
          codeCompletion,
          // python(),
          customHighlightStyle,
          javascript({
            typescript: true,
          }),
          currentDocValue,
          themeExtn,
          // Forces single line mode
          // EditorState.transactionFilter.of((tr) =>
          //   tr.newDoc.lines > 1 ? [] : tr
          // ),
          compartment.of(EditorState.tabSize.of(2)),
        ],
      }),
      parent: document.body,
    });

    this.ref.nativeElement.appendChild(this.codeMirrorView.dom);
  }

  /**
   * Updated the value in the view state
   */
  updateState() {
    let transaction = this.codeMirrorView.state.update({
      changes: { from: 4, insert: 'Aniket' },
    });
    console.log(transaction.state.doc.toString()); // "0123"
    // At this point the view still shows the old state.
    this.codeMirrorView.dispatch(transaction);
    // And now it shows the new state.
  }

  /**
   * Returns code editor value
   * */
  getValue() {
    return this.codeMirrorView.state.doc;
  }

  setTabSize(size: number) {
    this.codeMirrorView.dispatch({
      effects: compartment.reconfigure(EditorState.tabSize.of(size)),
    });
  }

  addDecorations() {}
  ngDoCheck(): void {}

  ngOnDestroy() {
    this.codeMirrorView.destroy();
  }
}
