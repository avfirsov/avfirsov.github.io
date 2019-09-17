//параметры конструктора:
//elem: <TD> с динамической ячейкой - обязательный параметр
//range: указывает какие DOM элементы подлежат суммированию (или умножению)
//       'row' - все <TD> в ряду, до первого лежащего ранее <TH>,
//       'column' - все <TD> в столбце до первого лежащего выше <TH>
//       'charge' - заряд молекулы из compoundObj
//       'oxiState' - степень окисления данного elementObj
//       'atoms' - все, что влияет на количество атомов elementObj в веществе compoundObj (индекс, индексы скобок, если вещество в скобках)
//       'atomsTotal' - все, что и в 'atoms' + <.coefficient>
//       'electrons' - все, что в 'atomsTotal' + <.electrons>
//operation: показывает, что сделать с содержимым ячеек из range: 
//        'sum' - сложить
//        'multiply' - умножить (будет выставлено автоматически, если range != 'row' || 'column', в остальных случаях - обязательный параметр)
//compoundObj: указывает на связанный с ячейкой compoundObj. Не надо, если range == 'row' || 'column'
//elementObj: указывает на связанный с ячейкой elementObj. Не надо, если range == 'row' || 'column' || 'charge'
class DymnamicCell {
  constructor({elem, range, operation, compoundObj, elementObj}) {
    [this.elem, this.range, this.operation, this.compoundObj, this.elementObj] = [elem, range, operation, compoundObj || elementObj.compoundObj, elementObj];
  }
  getRangeElemsArr() {
    const result = [];
    const [tr, range] = [this.elem.closest('tr'), this.range];

    if (range == 'row') {
      let prevCell = this.elem.previousElementSibling;
      while (prevCell) {
        if (prevCell.tagName == 'TD') result.push(prevCell);
        if (prevCell.tagName == 'TH') break; 
        prevCell = prevCell.previousElementSibling;
      }
      return result;
    }

    if (range == 'column') {
      //для начала находим "истинный" columnIndex нашей ячейки. Истинный cellIndex складывается из cellIndex нашей ячейки и колспанов всех ячеек перед ней
      let columnInd = this.elem.cellIndex;
      let prevElem = this.elem.previousElementSibling;
      while (prevElem) {
        if (['TD', 'TH'].includes(prevElem.tagName)) columnInd += prevElem.getAttribute('colspan');  
        prevElem = prevCell.previousElementSibling;
      }

      let prevRow = tr.previousElementSibling;
      while (prevRow) {
        if (prevRow.tagName != 'TR') break;
        result.push(prevRow.cells[columnInd]);
        prevRow = prevRow.previousElementSibling;
      }
      return result;
    }
    //для оставшихся вариантов надо чтобы был задан compoundObj 
    const compoundObj = this.compoundObj;
    const compoundDOM = compoundObj.elem;
    if (!compoundObj) throw new Error('must have declared compoundObj', this); 
    //для всех дальнейших диапазонов требуется умножение, поэтому принудительно устанавливаем тип операции 'multiply'
    this.operation = 'multiply';

    if (range == 'charge') {
      const chargeDOM = Reaction.getCompoundChargeDOM(compoundDOM); 
      result.push(chargeDOM);
      return result;
    }

    //для оставшихся вариантов надо чтобы был задан elementObj
    const elementObj = this.elementObj;
    if (!this.elementObj) throw new Error('must have declared elementObj', this);
    const elementDOM = elementObj.elem;

    if (range == 'oxiState') {
      result.push(Reaction.getOxiStateDOM(elementDOM));
      return result;
    }

    const {coefDOM, indexDOM, roundBracketIndexDOM, squareBracketIndexDOM} = Reaction.getElementRealtedDOMs(elementDOM);
    result.concat([indexDOM, roundBracketIndexDOM, squareBracketIndexDOM].filter(Boolean));

    if (range == 'atoms') {
      return result;
    }
    
    if (coefDOM) result.push(coefDOM);

    if (range == 'atomsTotal') {
      return result;
    }

    //с электронами работает пока только если электроны в веществе меняются у одного элемента
    let electronsDOM = compoundDOM.querySelector('.electrons');
    if (electronsDOM) result.push(electronsDOM);

    if (range == 'electrons') {
      return result; 
    }    

    else console.log('unknown instruction');   
  }
  calculate() {
    const range = this.getRangeElemsArr();
    //если надо сложить все - то начинаем с 0, если надо умножить все - начинаем с 1
    const startFrom = this.operation == 'multiply' ? 1 : 0;
    this.elem.textContent = range.reduce((sum, currentDOM) => {
      //на случай, если currentDOM - инпут, берем прозапас .value
      //на случай, если currentDOM - <.electrons>, берем первые символы до буквы 'e' - это есть число сколько уходит/приходит электронов
      const txt = currentDOM.textContent || currentDOM.value;
      const currentVal = parseInt(isNaN(txt) ? txt.split('e')[0] : txt);
      if (this.operation == 'multiply') return sum * currentVal;
      else if (this.operation == 'sum') return sum + currentVal;
    }, startFrom);
  }
  showDetails() {
    ////////
    //... //
    ////////
    if (this.elem.textContent == 0 || isNaN(this.elem.textContent)) return;
    let resultHTML = this.elem.textContent + ' = ';
    const operator = this.operation == 'sum' ? ' + ' : ' * ';
    resultHTML += coverRangeWithSpan(this.getRangeElemsArr()).join(operator);
    this.elem.innerHTML = resultHTML;
  }
  hideDetails() {
    const txt = this.elem.textContent;
    this.elem.textContent = txt.slice(0, txt.indexOf(' '));
    //удаляем лишние элементы с реакции, если надо
    if (this.compoundObj) Reaction.clearUnnecessary(this.compoundObj.elem);
    
    [...Array(5).keys()].forEach( i => {
      [...document.querySelectorAll(`hl${i}`)].forEach(elem => {
        if (!elem.matches('input')) {
          elem.parentElement.textContent = elem.textContent;
          elem.remove();
        } else {
          elem.classList.remove(`hl${i}`);
        }
      });
    });
  }
}


class DynamicRow {
  constructor({elem, criteria, symbol}) {
    [this.elem, this.ifCorrect, this.symbol] = [elem, criteria.bind(this), symbol];
    this.dynamicCells = [];
  }
  addDynamicCell(options) {
    const td = addCell(this.elem);
    const cellObj = new DynamicCell({elem: td, ...options});
    this.dynamicCells.push(cellObj);
    return cellObj;
  }
  addTableBoundCell(range, operation) {
    const cellObj = this.addDynamicCell({range, operation});
    cellObj.calculate();
    return cellObj;
  }
  addCompoundBoundCell(range, compoundObj, elementObj) {
    const cellObj = this.addDynamicCell({range, compoundObj, elementObj});
    cellObj.calculate();
    return cellObj;
  } 
  //требуются комментарии
  refresh(chemicalObj) {
    if (!chemicalObj) {
      this.dynamicCells.forEach( dynamicCell => dynamicCell.calculate());
      return;
    } else if (chemicalObj.elem.classList.contains('compound')) {
      this.dynamicCells.sort(dynamicCell => dynamicCell.compoundObj == chemicalObj).forEach(dynamicCell => dynamicCell.calculate());
      this.dynamicCells.sort(dynamicCell => ['row', 'column'].includes(dynamicCell.setRange)).forEach(dynamicCell => dynamicCell.calculate());
      return;
    } else if (chemicalObj.elem.classList.contains('elem')) {
      this.dynamicCells.sort(dynamicCell => dynamicCell.elementObj == chemicalObj).forEach(dynamicCell => dynamicCell.calculate());
      this.dynamicCells.sort(dynamicCell => ['row', 'column'].includes(dynamicCell.setRange)).forEach(dynamicCell => dynamicCell.calculate());
      return;
    }
  }

  colorize() {
    const tr = this.elem;
    if (this.ifCorrect()) tr.classList.add('correct');
    else tr.classList.remove('correct');
  }
}

class ReactionTable {
  constructor({elem, reactionDOM}) {
    [this.elem, this.reactionDOM] = [elem, reactionDOM];
    this.reactionDOM.addEventListener('sendData', recieveData.bind(this));
    this.sendBindEvent();
    
    function recieveData(e) {
      console.groupCollapsed('Recieved Data', e.detail);
      //если таблица еще не сделана, делаем ее по 
      // в e.detail точно должно присутствовать свойство reactionTree, содержащее объект ReactionTree сопряженной реакции
      this.reactionTree = e.detail.reactionTree;
      if (!this.table) {
        console.groupCollapsed('Has no table yet, so will build it');
        this.build();
        console.groupEnd('Has no table yet, so will build it');
        return;
      }
      //также, если в DOM реакции были изменения, в e.detail будет свойство changedDOM
      const changedObj = e.detail.changedObj;
      if (changedObj) {
        console.groupCollapsed('Already has table, so will refresh it');
        this.refresh(changedObj);
        console.groupEnd('Already has table, so will refresh it');
      }
      console.groupEnd('Recieved Data', e.detail);
    }
  }
  build() {
    const table = document.createElement('table');
    this.elem.append(table);
    table.classList.add('reactionTable');
    this.table = table;
    this.buildHeading();
    this.markupBody();
    this.dynamicRows = [];

    document.addEventListener('click', onClick.bind(this));

    function onClick(e) {
      const target = e.target;
      if (!this.table.contains(target)) { 
        this.hideDetails();
        return;
      }
      const cellDOM = target.closest('td') || target.closest('th');
      console.log('clicked on', cellDOM);
      //возможно надо будет добавить условие || cellDOM.textContent == ' ' (с пробелом)
      //это на случай, если надо будет вставлять пробелы в пустые ячейки
      if (!cellDOM || isNaN(cellDOM.textContent) || cellDOM.textContent == '') return;   

      this.hideDetails();
      if (this._detailed && this._detailed.elem == cellDOM) {
        return;
      }      
      this.showDetails(cellDOM);
    } 
  }
  markupBody() {
    [...this.reactionTree.getElementsList()].forEach(symbol => {
      const criteria = function() {
        return this.sumLeft.elem.textContent == this.sumRight.elem.textContent;
      };
      const tr = this.addDynamicRow({criteria, symbol});
      addHeadCell(tr, symbol);
    });

    if (this.reactionDOM.querySelector('.electrons')) {
      const criteria = function() {
        return this.sum.elem.textContent == 0;
      };
      const symbol = 'e-';
      const tr = this.addDynamicRow({criteria, symbol});
      addHeadCell(tr, electron);
    }
  }
  addDynamicRow({criteria, symbol}) {
    const tr = addRow(this.table);
    const rowObj = new DynamicRow({elem: tr, criteria, symbol});
    this.dynamicRows.push(rowObj); 
    return rowObj;
  }
  refresh(chemicalObj) {
    this.dynamicRows.forEach( dynamicRow => dynamicRow.refresh(chemicalObj));
  }
  showDetails() {
    if (this._detailed) this.hideDetails();
    const cellObj = this.getDynamicCellByTD(td);
    if (!cellObj) return;
    cellObj.showDetails();
    this._detailed = cellObj;
  }
  hideDetails() {
    if (this._detailed) this._detailed.hideDetails(); 
    delete this._detailed;
  }
  getDynamicCellByTD(td) {
    let obj;
    this.dynamicRows.find(dynamicRow => obj = dynamicRow.dynamicCells.find(dynamicCell => dynamicCell.elem == td));
    return obj;
  }
  colorize() {
    this.dynamicRows.forEach( dynamicRow => {
      dynamicRow.colorize();
    });
  }
  sendBindEvent() {
    console.groupCollapsed('Sending bind event');
    const bindEvent = new CustomEvent('bind', {
      bubbles: true,
      detail: {reaction: this.reactionDOM}
    })
    console.groupEnd('Sending bind event');
    this.elem.dispatchEvent(bindEvent);
    console.log('sent bind event', bindEvent);
  }
}

class ElementsTable {
  constructor(options) {
    super(options);
  }
  build() {
    super.build();
    [...this.reactionDOM.querrySelectorAll('.compound')].forEach( compoundDOM => {
      this.dynamicRows.forEach(dynamicRow => {
        const tr = dynamicRow.elem;
        const symbol = dynamicRow.symbol;
        const RT = this.reactionTree;
        const compoundObj = RT.getObjByDOM(compoundDOM);
        //если текущий ряд - ряд электронов
        if (symbol == 'e-') {
          //не нужно заполнять электроны для продуктов
          if (RT.products.includes(compoundDOM)) return;

          const electronsDOM = this.reactionDOM.querySelector('.electrons');
          //если у вещества нет электронов, добавляем в ряд статическую ячейку с 0
          if (!electronsDOM) {
            addCell(tr, '0');
            return;
          }
          const elementObj = RT.getObjByDOM(electronsDOM.closest('.elem'));
          const atomsTotalCellObj = dynamicRow.addCompoundBoundCell('electrons', compoundObj, elementObj)
          atomsTotalCellObj.calculate();
          //добавляем сумму в конце реагентов
          if (compoundDOM.nextSibling.textContent.includes(ARROW)) {
            dynamicRow.sum = dynamicRow.addTableBoundCell('row', 'sum');
          }
          return;
        }

        const elementObj = compoundObj[symbol];
        //если в веществе нету такого элемента с таким symbol, добавляем статическую ячейку с нулем
        if (!elementObj) {
          addCell(tr, '0');
          return;
        }
        const atomsTotalCellObj = dynamicRow.addCompoundBoundCell('atomsTotal', compoundObj, elementObj);
        atomsTotalCellObj.calculate();

        if (!compoundDOM.nextSibling || compoundDOM.nextSibling.textContent.includes(ARROW)) {
          if (!dynamicRow.sumLeft) dynamicRow.sumLeft = addSumRowCell(dynamicRow);
          else dynamicRow.sumRight = dynamicRow.addTableBoundCell('row', 'sum');
        }
      });    
    });
  }
  buildHeading() {}
  refresh(chemicalObj) {
    if (!chemicalObj.elem.classList.contains('compound')) return;
    super.refresh(chemicalObj);
  }
}

class OxiStatesTable {
  constructor(options) {
    super(options);
  }
  build() {
    if (this.reactionDOM.querySelectorAll('.compound')[1]) throw new Error('must have only one compound!', this);
    super.build();
    
    const RT = this.reactionTree;
    if (RT.compoundObjsArr[1]) throw new Error('must be built under one compound', this);
    
    const compoundObj = RT.compoundObjsArr[0];
    const compoundDOM = compoundObj.elem;
    this.dynamicRows.forEach(dynamicRow => {
      const symbol = dynamicRow.symbol;
      const elementObj = compoundObj[symbol];
      dynamicRow.addCompoundBoundCell('oxiState', compoundObj, elementObj);
      dynamicRow.addCompoundBoundCell('atoms', compoundObj, elementObj);
      dynamicRow.addTableBoundCell('row','multiply');
    });
    //добавляем ряд с суммой по всем-всем степеням окисления
    {
      const criteria = function() {
        return this.sum.elem.textContent == this.sumMustBe;
      }
      const rowObj = this.addDynamicRow({criteria});
      const th = addHeadCell(rowObj.elem, 'Сумма всех степеней окисления сейчас:');
      th.setAttribute('colspan', '3');
      rowObj.sum = rowObj.addTableBoundCell('column', 'sum');
      rowObj.sumMustBe = Reaction.getCompoundChargeVal(compoundDOM);
    }
    //добавляем ряд с зарядом молекулы
    {
      const criteria = function() {
        return false;
      }
      const rowObj = this.addDynamicRow({criteria});
      const th = addHeadCell(rowObj.elem, 'Сумма всех степеней окисления должна быть:');
      th.setAttribute('colspan', '3');
      rowObj.addCompoundBoundCell('charge', compoundObj);
    }
  }
  buildHeading() {}
  refresh(chemicalObj) {
    if (!chemicalObj.elem.classList.contains('elem')) return;
    super.refresh(chemicalObj);
  }
}
        
