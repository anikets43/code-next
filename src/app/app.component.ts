import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DoCheck,
  ElementRef,
  forwardRef,
  Inject,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import { EditorView, placeholder } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import {
  defaultHighlightStyle,
  tags,
  HighlightStyle,
} from '@codemirror/highlight';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit, OnDestroy, DoCheck {
  @ViewChild('ref') ref!: ElementRef<HTMLDivElement>;

  title = 'code-next';

  codeMirror: any;

  value = '';

  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngAfterViewInit(): void {
    debugger;
    let view = new EditorView({
      state: EditorState.create({
        doc: `return None`,
        extensions: [
          // basicSetup,
          EditorView.contentAttributes.of({ contenteditable: 'true' }),
          placeholder('Add your code...'),
          lineNumbers(),
          python(),
          defaultHighlightStyle,
          closeBrackets(),
          // autocompletion(),
          // keymap.of(indentWithTab),

          // keymap.of([...completionKeymap]),
          // autocomplete({
          //   completeAt(state, pos) {
          //     return new Promise((resolve) => {
          //       const line = state.doc.lineAt(pos);
          //       const before = state.doc.slice(line.start, pos);
          //       const after = state.doc.slice(pos, line.end);
          //       // Do not auto-complete in the middle of words
          //       if (after.length > 0 && after[0].match(/\w/)) {
          //         return resolve({ items: [] });
          //       }
          //       // get prefix
          //       const matches = before.match(/\W(\w+)$/);
          //       if (!matches) return resolve({ items: [] });
          //       const prefix = matches[1];
          //       const start = pos - prefix.length;

          //       // FIXME nvda in einer VM ausprobieren
          //       let items = [
          //         'git',
          //         'add',
          //         'addNote',
          //         'addRemote',
          //         'annotatedTag',
          //         'branch',
          //         'checkout',
          //         'clone',
          //         'commit',
          //         'currentBranch',
          //         'deleteBranch',
          //         'deleteRef',
          //         'deleteRemote',
          //         'deleteTag',
          //         'expandOid',
          //         'expandRef',
          //         'fetch',
          //         'findMergeBase',
          //         'findRoot',
          //         'getConfig',
          //         'getConfigAll',
          //         'getRemoteInfo',
          //         'hashBlob',
          //         'indexPack',
          //         'init',
          //         'isDescendent',
          //         'listBranches',
          //         'listFiles',
          //         'listNotes',
          //         'listRemotes',
          //         'listTags',
          //         'log',
          //         'merge',
          //         'packObjects',
          //         'pull',
          //         'push',
          //         'readBlob',
          //         'readCommit',
          //         'readNote',
          //         'readObject',
          //         'readTag',
          //         'readTree',
          //         'remove',
          //         'removeNote',
          //         'resetIndex',
          //         'resolveRef',
          //         'setConfig',
          //         'status',
          //         'statusMatrix',
          //         'tag',
          //         'verify',
          //         'version',
          //         'walk',
          //         'writeBlob',
          //         'writeCommit',
          //         'writeObject',
          //         'writeRef',
          //         'writeTag',
          //         'writeTree',
          //       ]
          //         .filter((s) => s.startsWith(prefix) && s !== prefix)
          //         .map((s) => ({ label: s, insertText: s }));
          //       setTimeout(() => resolve({ start: start, items }), 100);
          //     });
          //   },
          // }),
          // autocompletion(),
          // keymap(baseKeymap),
        ],
      }),
    });

    this.ref.nativeElement.appendChild(view.dom);
  }

  ngDoCheck(): void {}

  ngOnDestroy() {}
}
function lineNumbers(): import('@codemirror/state').Extension {
  throw new Error('Function not implemented.');
}
