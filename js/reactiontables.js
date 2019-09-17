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
class DynamicCell {
  constructor({elem, range, operation, compoundObj, elementObj, modificator}) {
    [this.elem, this.range, this.operation, this.compoundObj, this.elementObj] = [elem, range, operation, compoundObj, elementObj];
    if (modificator) {
      this._calculate = this.calculate;
      this.calculate = function() {
        this._calculate();
        this.elem.textContent = modificator(this.elem.textContent);
      } 
    }
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
        if (['TD', 'TH'].includes(prevElem.tagName)) columnInd += parseInt(prevElem.getAttribute('colspan')) - 1;  
        prevElem = prevElem.previousElementSibling;
      }

      let prevRow = tr.previousElementSibling;
      while (prevRow) {
        if (prevRow.tagName != 'TR') break;
        if (prevRow.cells[columnInd].textContent != '') result.push(prevRow.cells[columnInd]);
        prevRow = prevRow.previousElementSibling;
      }
      return result;
    }
    //для оставшихся вариантов надо чтобы был задан compoundObj 
    const compoundObj = this.compoundObj;
    if (!compoundObj) throw new Error('must have declared compoundObj', this); 
    const compoundDOM = compoundObj.elem;
    
    if (range == 'charge') {
      const chargeDOM = Reaction.showExplicitCharge(compoundDOM);
      return [chargeDOM]; 
    }
    
    //для оставшихся вариантов надо чтобы был задан elementObj
    const elementObj = this.elementObj;
    if (!this.elementObj) throw new Error('must have declared elementObj', this);
    const elementDOM = elementObj.elem;
    //для всех дальнейших диапазонов требуется умножение, поэтому принудительно устанавливаем тип операции 'multiply'
    this.operation = 'multiply';


    if (range == 'oxiState') {
      const oxiStateDOM = Reaction.getOxiStateDOM(elementDOM);
      return [oxiStateDOM]; 
    }
    
    let [indexDOM, roundBracketIndexDOM, squareBracketIndexDOM] = [Reaction.showExplicitIndex(elementDOM), 
                                                              Reaction.showExplicitCloseBracketIndex(elementDOM, 'round'), 
                                                              Reaction.showExplicitCloseBracketIndex(elementDOM, 'square')]
    
    result.push(indexDOM, roundBracketIndexDOM, squareBracketIndexDOM);
    
    if (range == 'atoms') {
      return result;
    }
    
    let coefDOM = Reaction.showExplicitCoef(elementDOM);

    result.push(coefDOM);

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
    const cell = this.elem;
    const range = this.range;
    const compoundObj = this.compoundObj;
    const elementObj = this.elementObj;
    const compoundDOM = compoundObj && compoundObj.elem;

    if (range == 'oxiState') {
      cell.textContent = Reaction.getOxiStateVal(elementObj.elem);
      return;
    }

    if (range == 'charge') {
      cell.textContent = Reaction.getCompoundChargeVal(compoundDOM);
      return;
    }
    
    if (range == 'atoms') {
      cell.textContent = elementObj.getTotal();
      return;
    }

    if (range == 'atomsTotal') {
      cell.textContent = compoundObj.getQuantity(elementObj.symbol, true);
      // elementObj.getTotal() * compoundObj.coefficient;
      return;
    }

    if (range == 'electrons') {
      cell.textContent = explicitShowPlus(compoundObj.getDeltaElectrons());
      return;
    }
    //дальше - только если в диапазоне зависимых ячеек только табличные ячейки. Тогда надо взять их массив и выполнить операцию над каждой из них
    const rangeArr = this.getRangeElemsArr();
    if (!rangeArr[0]) return;
    //если надо сложить все - то начинаем с 0, если надо умножить все - начинаем с 1
    const startFrom = this.operation == 'multiply' ? 1 : 0;
    cell.textContent = rangeArr.reduce((sum, currentDOM) => {
      //на случай, если currentDOM - инпут, берем прозапас .value
      //на случай, если currentDOM - <.electrons>, берем первые символы до буквы 'e' - это есть число сколько уходит/приходит электронов
      const txt = currentDOM.textContent || currentDOM.value;
      const currentVal = parseFloat(txt);
      // parseInt(isNaN(txt) ? txt.split('e')[0] : txt);
      if (this.operation == 'multiply') return sum * currentVal;
      else if (this.operation == 'sum') return sum + (currentVal || 0);
    }, startFrom);
    if (isNaN(cell.textContent)) cell.textContent = ''; 
  }
  showDetails() {
    let resultHTML = this.elem.textContent + ' = ';
    const operator = this.operation == 'sum' ? ' + ' : ' * ';
    //если элемент не в скобках, то в массиве из this.getRangeElemsArr() будут пустые элементы на местах этих элементов
    //поэтому фильтруем массив от пустот через .filter(Boolean)
    const rangeArr = this.getRangeElemsArr().filter(Boolean).reverse();
    console.log(rangeArr);
    //если в диапазоне суммируемых ячеек только одна ячейка, то просто ее выделяем
    if (!rangeArr[1]) {
      coverWithSpan(this.elem, 'hl0');
      coverWithSpan(rangeArr[0], 'hl0');
      return; 
    }
    resultHTML += coverRangeWithSpan(rangeArr).join(operator);
    this.elem.innerHTML = resultHTML;
  }
  hideDetails() {
    clearCell.call(this);
    //удаляем лишние элементы с реакции, если надо
    if (this.compoundObj) Reaction.clearUnnecessary(this.compoundObj.elem);
    
    [...Array(5).keys()].forEach( i => {
      [...document.querySelectorAll(`.hl${i}`)].forEach(elem => {
        console.log(elem);
        if (!elem) return;
        if (elem.matches('span')) {
          elem.parentElement.textContent = elem.textContent;
          elem.remove();
        } else {
          elem.classList.remove(`hl${i}`);
        }
      });
    });
    function clearCell() {
      const txt = this.elem.textContent;
      //ячейки со степенью окисления и зарядом не содержат пробелов вообще, для них надо просто убрать спан в ячейке
      if (!txt.includes(' ')) {
        this.elem.innerHTML = this.elem.textContent;
        //убрать выделение с молекулы
        return;
      }
      this.elem.textContent = txt.slice(0, txt.indexOf(' '));
    }
  }
}


class DynamicRow {
  constructor({elem, criteria, symbol}) {
    [this.elem, this.ifCorrect, this.symbol] = [elem, criteria.bind(this), symbol];
    this.dynamicCells = [];
  }
  addDynamicCell(options) {
    //для сумм и мультипликаторов по ряду/столбцу добавляем th, иначе - td
    const cell = ['row', 'column'].includes(options.range) ? addHeadCell(this.elem) : addCell(this.elem);
    const cellObj = new DynamicCell({elem: cell, ...options});
    this.dynamicCells.push(cellObj);
    return cellObj;
  }
  addTableBoundCell(range, operation, modificator) {
    const cellObj = this.addDynamicCell({range, operation, modificator});
    cellObj.calculate();
    return cellObj;
  }
  addCompoundBoundCell(range, compoundObj, elementObj, modificator) {
    //если в веществе нету такого элемента с таким symbol, добавляем статическую ячейку с нулем
    if (!elementObj && ['oxiState', 'atoms', 'atomsTotal', 'electrons'].includes(range)) {
      addCell(this.elem, '0');
      return;
    }
    const cellObj = this.addDynamicCell({range, compoundObj, elementObj, modificator});
    cellObj.calculate();
    return cellObj;
  } 
  //требуются комментарии
  refresh(chemicalObj) {
    if (chemicalObj) {
      if (chemicalObj.elem.classList.contains('compound')) {
        this.dynamicCells.sort(dynamicCell => dynamicCell.compoundObj == chemicalObj).forEach(dynamicCell => dynamicCell.calculate());
      } else if (chemicalObj.elem.classList.contains('elem')) {
        this.dynamicCells.sort(dynamicCell => dynamicCell.elementObj == chemicalObj).forEach(dynamicCell => dynamicCell.calculate());
      }
      this.dynamicCells.sort(dynamicCell => ['row', 'column'].includes(dynamicCell.setRange)).forEach(dynamicCell => dynamicCell.calculate());
    } else if (!chemicalObj) {
      this.dynamicCells.forEach( dynamicCell => dynamicCell.calculate());
    }
    console.log(this);
    this.colorize();
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
        
        //////////
        //DEBUG //
        //////////
        
        const self = this;
        setTimeout(()=>{self.refresh(changedObj)},100);
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
    this.dynamicRows = [];
    this.buildHeading();
    this.markupBody();

    document.addEventListener('click', onClick.bind(this));
    table.addEventListener('selectstart', preventPasteSelect);

    function onClick(e) {
      const target = e.target;
      const prevCell = this._detailed && this._detailed.elem
      
      this.hideDetails();

      const cellDOM = target.closest('td') || target.closest('th');
      console.log('clicked on', cellDOM);
      //возможно надо будет добавить условие || cellDOM.textContent == ' ' (с пробелом)
      //это на случай, если надо будет вставлять пробелы в пустые ячейки
      if (!cellDOM || isNaN(cellDOM.textContent) || cellDOM.textContent == '') return;   

      const self = this;

      if (prevCell != cellDOM) setTimeout(self.showDetails.bind(self, cellDOM),0);
    } 
  }
  buildHeading() {
    const thead = document.createElement('thead');
    this.table.append(thead);

    const tr = addRow(thead);
    return tr;
  }
  markupBody() {
    const tbody = document.createElement('tbody');
    this.table.append(tbody);
    this.tbody = tbody;

    [...this.reactionTree.getElementsList()].forEach(symbol => {
      const criteria = function() {
        return this.sumLeft && this.sumRight && this.sumLeft.elem.textContent == this.sumRight.elem.textContent;
      };
      const rowObj = this.addDynamicRow({criteria, symbol});
      //выделяем графически ряды с элементами от прочих рядов классом .elementsRow
      rowObj.elem.classList.add('elementsRow');
      addHeadCell(rowObj.elem, symbol);
    });

    if (this.reactionDOM.querySelector('.electrons')) {
      const criteria = function() {
        return this.sum.elem.textContent == 0;
      };
      const symbol = 'e-';
      const rowObj = this.addDynamicRow({criteria, symbol});
      addHeadCell(rowObj.elem, electron);
    }
  }
  addDynamicRow({criteria, symbol}) {
    const tr = addRow(this.tbody);
    const rowObj = new DynamicRow({elem: tr, criteria, symbol});
    this.dynamicRows.push(rowObj); 
    return rowObj;
  }
  refresh(chemicalObj) {
    this.dynamicRows.forEach( dynamicRow => dynamicRow.refresh(chemicalObj));
  }
  showDetails(td) {
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
      console.log(dynamicRow);
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

class ElementsTable extends ReactionTable{
  constructor(options) {
    super(options);
  }
  build() {
    super.build();
    //переписать через this.reactionTree.compoundObjsArr.forEach(compoundObj => {...
    this.reactionTree.compoundObjsArr.forEach( compoundObj => {
      const compoundDOM = compoundObj.elem;
      this.dynamicRows.forEach(dynamicRow => {
        const tr = dynamicRow.elem;
        const symbol = dynamicRow.symbol;
        const RT = this.reactionTree;
        const compoundObj = RT.getObjByDOM(compoundDOM);
        //если текущий ряд - ряд электронов
        if (symbol == 'e-') {
          //не нужно заполнять электроны для продуктов
          if (RT._products.includes(compoundDOM)) return;

          const electronsDOM = compoundDOM.querySelector('.electrons');
          const elementObj = electronsDOM && RT.getObjByDOM(electronsDOM.closest('.elem')) || undefined;
          dynamicRow.addCompoundBoundCell('electrons', compoundObj, elementObj)
          //добавляем сумму в конце реагентов
          if (compoundDOM.nextSibling.textContent.includes(ARROW)) {
            dynamicRow.sum = dynamicRow.addTableBoundCell('row', 'sum', explicitShowPlus);
          }
          return;
        }

        const elementObj = compoundObj[symbol];
        dynamicRow.addCompoundBoundCell('atomsTotal', compoundObj, elementObj);

        if (!compoundDOM.nextSibling || compoundDOM.nextSibling.textContent.includes(ARROW)) {
          const sumCellObj = dynamicRow.addTableBoundCell('row', 'sum');
          if (!dynamicRow.sumLeft) dynamicRow.sumLeft = sumCellObj;  
          else dynamicRow.sumRight = sumCellObj;
        }
      });    
    });
    this.colorize();
  }
  buildHeading() {
    const tr = super.buildHeading();
    addHeadCell(tr, 'Элемент');

    this.reactionTree.compoundObjsArr.forEach(compoundObj => {
      addHeadCell(tr, `<div class="reaction">${compoundObj.formula}</div>`);
      if (compoundObj.elem.nextSibling && compoundObj.elem.nextSibling.textContent.includes(ARROW)) {
          addHeadCell(tr, 'Сумма атомов элемента слева', 'sumCaption');
        }
    });
    //костыль, чтобы формулы в заголовках отображались с индексами под строкой
    //нормальное решение - это добавить в reactionTree метод getFormulaHTML с параметрами electrons, oxiStates, charge
    [...tr.querySelectorAll('.reaction')].forEach( divReaction => {
      const reaction = new Reaction( {elem: divReaction} );
      reaction.layout();
    });

    addHeadCell(tr, 'Сумма атомов элемента справа', 'sumCaption');
  }
  refresh(chemicalObj) {
    this.hideDetails();
    if (!chemicalObj.elem.classList.contains('compound')) return;
    super.refresh(chemicalObj);
  }
}

class OxiStatesTable extends ReactionTable{
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
      dynamicRow.addTableBoundCell('row','multiply', explicitShowPlus);
    });
    //добавляем ряд с суммой по всем-всем степеням окисления
    {
      const criteria = function() {
        return (this.sum.elem.textContent == this.sumMustBe && this.sum.elem.textContent != '');
      }
      const rowObj = this.addDynamicRow({criteria});
      rowObj.elem.classList.add('sumRow');
      const th = addHeadCell(rowObj.elem, 'Сумма всех степеней</br>окисления сейчас:', 'longCell');
      th.setAttribute('colspan', '3');
      rowObj.sum = rowObj.addTableBoundCell('column', 'sum', explicitShowPlus);
      rowObj.sumMustBe = Reaction.getCompoundChargeVal(compoundDOM);
    }
    //добавляем ряд с зарядом молекулы
    {
      const criteria = function() {
        return false;
      }
      const rowObj = this.addDynamicRow({criteria});
      const th = addHeadCell(rowObj.elem, 'Сумма всех степеней</br>окисления должна быть:', 'longCell');
      th.setAttribute('colspan', '3');
      rowObj.addCompoundBoundCell('charge', compoundObj, undefined, explicitShowPlus);
    }
    this.colorize();
  }
  buildHeading() {
    const tr = super.buildHeading();
    addHeadCell(tr, '<span>Элемент</span>'); 
    addHeadCell(tr, '<span>Степень окисления</span>');
    addHeadCell(tr, '<span>Количество атомов всего</span>');
    addHeadCell(tr, '<span>Сумма с.о. всех атомов</span>');
  }
  refresh(chemicalObj) {
    if (!chemicalObj.elem.classList.contains('elem')) return;
    super.refresh(chemicalObj);
  }
}
        
