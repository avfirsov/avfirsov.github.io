class RedOxBalanceInput extends ExercizePiece{
  constructor({elem, reactionDOM}) {
    super();
    [this.elem, this.reactionDOM,this.active, this._SOLUTION, this._editable] = [elem, reactionDOM, false, [], []];
    const highlighter = document.createElement('span');
    this.elem.append(highlighter);
  }
  activate() {
    if (this.active == true) return;
    this.active = true;

    //чтобы выделить визуально активную ячейку таблицы, добавляем к содержимому класс .active, а если содержимого нету - 
    //то вкладываем в нее span - для конкретно span.active будет задаваться ширина и высота в css
    //1) почему не задать стили просто ячейке таблицы (this.elem)? -потому что это не лучшее решение: в таблице ячейка имеет padding, чтобы
    //отступать от ячеек слева, и если задать ей границы то будет не красиво. Это общее правило, что лучше сами ячейки не стилизовать, а стилизовать то, что внутри
    //2) почему именно span, а не div? - потому что если в ячейке уже есть контент, то это div. Для него не надо задавать ширину/высоту а только обводку, 
    //поэтому чтобы различить их в css, используем span  
    const content = this.elem.querySelector('.elem') || this.elem.querySelector('span');
    if (content) {
      content.classList.add('active');
    }
    // else {
    //   const highlighter = document.createElement('span');
    //   this.elem.append(highlighter);
    //   highlighter.classList.add('active');
    // }

    const self = this;
    
    console.log('setting listener');

    self.__onReactionClick = self._onReactionClick.bind(self);
    this.reactionDOM.addEventListener('click', self.__onReactionClick);
  }
  deactivate() {
    console.log('deactivating');
    if (this.active == false) return;
    this.active = false;
    console.log('deactivated', this.active, this.elem, this.elem.querySelector('.active'));

    const active = this.elem.querySelector('.active');
    if (active && active.textContent) active.classList.remove('active');
    else if (active) {
      active.classList.remove('active');
    }  
      // active.remove();
    this.reactionDOM.removeEventListener('click', this.__onReactionClick);
  }
  _onReactionClick(e) {
    console.log('clicked on reactionDOM');

    const target = e.target;
    const elementDOM = target.closest('.elem');
    console.log('elementDOM', elementDOM);
    if (!elementDOM) return;
    
    const oxiStateVal =  Reaction.getOxiStateVal(elementDOM);
    console.log('oxiStateVal', oxiStateVal); 
    if (!oxiStateVal) return;

    const symbol = Reaction.getFormulaByDOM(elementDOM);
    console.log('symbol', symbol);

    this.elem.innerHTML = `<div class="elem">${symbol}<sup>${oxiStateVal}</sup></div>`;
    const self = this;
    // setTimeout(self.deactivate, 10);
    this.sendTrialEvent();
  }
}

class DeltaElectronsValInput extends CoefInput {
  showInput() {
    super.showInput();
    this.input.value = 1;
  }
  hide() {
   if (this.input.value == 1) {
      const coefficient = document.createElement('div');
      coefficient.className = "coefficient";
      coefficient.textContent = this.input.value;
      this._container.before(coefficient);
    }
    super.hide();    
  }
}


class DeltaElectronsInput extends OxiStateInput {
  constructor(options) {
    super(options);
    this._lowLimit = -8;
    this._topLimit = 8; 
  }
  showInput() {
    const self = this;
    //вызываем метод родителя, который связывает this.value жестко с input.value
    const input = Object.getPrototypeOf(Object.getPrototypeOf(this)).__proto__.showInput.call(this);
    input.placeholder = "+1";

    this.elem.prepend(input);
    //вызываем метод родителя по созданию кнопок увеличения-уменьшения
    this.createControls();
    //добавляем контейнеру класс для навигации и стилей
    this._container.classList.add("coefInput");

    this.__onKeyPress = self._onKeyPress.bind(self);
    this.input.addEventListener('keypress', this.__onKeyPress);
    this._checkCurrentValue();
  }
  //делаем недосигаемым значение 0
  _checkCurrentValue() {
    const input = this.input;
    if (input.value == 0) {
      if (this._save == '+1') input.value = -1;
      if (this._save == '-1') input.value = 1;
    }
    super._checkCurrentValue();
  }
  //запрещаем вводить 0
  _onKeyPress(e) {
    e = e || event;
    const char = getChar(e);
    if (char == 0) e.preventDefault();
    super._onKeyPress(e);
  }
  hide() {
    //удаляем наблюдателей
    this.input.removeEventListener('keypress', this.__onKeyPress);
    // если в инпут ничего не введено, или введена единица - не показываем вместо инпута ничего
    // иначе - на месте инпута создаем sup со значением инпута
    const result = document.createTextNode(this.input.value);
    this.elem.prepend(result); 
    const input = Object.getPrototypeOf(Object.getPrototypeOf(this)).__proto__.hide.call(this);
  }
}


class RedOxBalance extends Exercize{
  constructor({elem, reactionDOM}) {
    super({elem});
    [this.reactionDOM, this.oxidizer, this.reducer] = [reactionDOM, {}, {}];
  }
  build() {
    const table = this.table = document.createElement('table');
    this.elem.append(table);
    
    ['oxidizer', 'reducer'].forEach(type => {
      const current = this[type];
      const tr = addRow(table);
      
      const caption = type == 'oxidizer' ? 'Окислитель:' : 'Восстановитель:';
      const captionCell = addHeadCell(tr, caption);
      captionCell.classList.add('caption');

      //версия для более длинного баланса
      // ['initial', 'deltaElectrons', 'final', 'deltaElectronsVal', 'multiplier'].forEach(property => {
      ['initial', 'deltaElectrons', 'final', 'multiplier'].forEach(property => {
        current[property] = {};
        const elem = current[property].elem = addCell(tr, '', property);
        // if (property == 'deltaElectronsVal' || property == 'multiplier') {
        if (property == 'multiplier') {  
          const coef = document.createElement('div');
          coef.classList.add('coefficient');
          elem.append(coef);
        }
        if (property == 'deltaElectrons') {
          addCell(tr, ARROW, 'arrow');
        }
        //устанавливаем чтобы для каждого свойства окислителя и восстанвителя по запросу .current прилетало текстовое содержимое его элемента 
        Object.defineProperty(current[property], 'current', {
          get: function() {return  current[property].elem.querySelector('input') && current[property].elem.querySelector('input').value || current[property].elem.textContent;}
        });
      });
    });
  }
  //options: 
  //{balance: [['symbol', %beginOxiState%, %endOxiState%], ['symbol', %beginOxiState%, %endOxiState%]],
  //solution: 'none'/'balance'/'deltaElectrons'/'deltaElectronsVal'/'multiplier', 
  //editable: 'none'/'balance'/'deltaElectrons'/'deltaElectronsVal'/'multiplier', - самое необязательное
  //print: ''/'none'/'balance'/'deltaElectrons'/'deltaElectronsVal'/'multiplier' -   показывает что отображать из текущего баланса
  //}
  //обязательно должен быть задан balance, если swt(options) делается первый раз
  //solution, editable и print - из них достаточно указать что-то одно
  //настройки solution влияют на editable и print и имеют над ними приоритет
  //настройки editable влияют на print и имеют над ними приоритет 
  set(options) {
    if (!this.table) this.build();

    //баланс должен быть обязательно задан в опциях
    const balance = options.balance;

    if (balance) {
      this.balance = balance;
      setBalance.call(this);
      setCorrect.call(this);
    } else if (!this.balance) return;

    const solution = options.solution;
    const editable = solution || options.editable;
    const print = solution && getPrevStage(solution) || editable && getPrevStage(editable) || options.print;
    
    printBalance.call(this);
    setEditable.call(this);
    setSolution.call(this);

    //устанавливаем обработчик на ввод пользователем любых данных
    const self = this;
    

    function setBalance() {
      balance.forEach( balanceArr => {
        if (balanceArr[1] - balanceArr[2] > 0) this.oxidizer.balance = balanceArr;
        else this.reducer.balance = balanceArr;
      }); 
    }
    //рассчитывает правильные решения
    function setCorrect() {
      ['oxidizer', 'reducer'].forEach(type => {
        const current = this[type];
        const deltaE = current.balance[1] - current.balance[2];
        const symbol = current.balance[0];
        current.initial.correct = `${symbol}${explicitShowPlus(current.balance[1])}`;
        current.final.correct = `${symbol}${explicitShowPlus(current.balance[2])}`;
        current.deltaElectronsVal = {};
        current.deltaElectronsVal.correct = Math.abs(deltaE);
        current.deltaElectrons.correct = explicitShowPlus(deltaE);
      });
      //меняем местами число электронов, чтобы получить множители баланса
      [this.oxidizer.multiplier.correct, this.reducer.multiplier.correct] = cutToCoprime([this.reducer.deltaElectronsVal.correct, this.oxidizer.deltaElectronsVal.correct]);
    }
    //возвращает стадию состояния RedOXBalance, предшествующую stage 
    function getPrevStage(stage) {
      // const stages = ['none', 'balance', 'deltaElectrons', 'deltaElectronsVal', 'multiplier'];
      const stages = ['none', 'balance', 'deltaElectrons', 'multiplier'];
      return stages[stages.indexOf(stage) - 1] || 'none'; 
    }
    function setSolution() {
      if (!solution) return;
      //очистить предыдущее решение
      this._SOLUTION = [];
      if (solution == 'none') return;

      ['oxidizer', 'reducer'].forEach(type => {
        if (solution == 'balance') this._SOLUTION.push(this[type].initial, this[type].final);
        else this._SOLUTION.push(this[type][solution]);
      });
      console.log(this._SOLUTION);
    }
    function setEditable() {
      this.elem.classList.remove('solvingBalance');        
      
      if (!editable) return;
      //очистить предыдущее editable
      this._editable && this._editable.forEach( inputObj => inputObj.hide && inputObj.hide() || inputObj.deactivate && inputObj.deactivate());
      this._editable = [];
      this.elem.removeEventListener('trial', this.__onTrial);
      if (editable == 'none') return;

      ['oxidizer', 'reducer'].forEach(type => {
        const current = this[type];
        if (editable == 'balance') {
          const initObj = new RedOxBalanceInput({elem: current.initial.elem, reactionDOM: this.reactionDOM});
          this._editable.push(initObj);

          const finalObj = new RedOxBalanceInput({elem: current.final.elem, reactionDOM: this.reactionDOM});
          this._editable.push(finalObj);
          //специальный класс для выделения визуального пока решаем баланс
          this.elem.classList.add('solvingBalance');

          return;
        }

        if (editable == 'deltaElectrons') {
          const deltaE = current.deltaElectrons.elem;

          if (!deltaE.textContent) deltaE.innerHTML = electron;
          const inputObj = new DeltaElectronsInput({elem: deltaE, showCondition: 'always'});
          inputObj.showInput();

          this._editable.push(inputObj);
          return;
        }

        // if (editable == 'deltaElectronsVal') {
        //   const deltaEVal = current.deltaElectronsVal.elem;
        //   const inputObj = new DeltaElectronsValInput({elem: deltaEVal, showCondition: 'always'});
        //   inputObj.showInput();

        //   this._editable.push(inputObj);
        //   return;
        // }

        if (editable == 'multiplier') {
          const multiplier = current.multiplier.elem;
          const inputObj = new DeltaElectronsValInput({elem: multiplier, showCondition: 'always'});
          inputObj.showInput();

          this._editable.push(inputObj);
          return;
        }                   
      });

      if (editable == 'balance') {
        const self = this;
        self.__activateBalanceOnClick = self._activateBalanceOnClick.bind(self);
        this.elem.addEventListener('click', self.__activateBalanceOnClick);
        this._activateNextRedOXInput();
      }

      const self = this;
      this.__onTrial = self.onTrial.bind(self);
      this.elem.addEventListener('trial', this.__onTrial);
    }
    function printBalance() {
      if (!print || print == 'none') return;

      ['oxidizer', 'reducer'].forEach(type => {
        const current = this[type];
        const symbol = current.balance[0];
        
        const initial = current.initial.elem;
        const final = current.final.elem;
        if (!initial.textContent) initial.innerHTML = `<div class="elem">${symbol}<sup>${explicitShowPlus(current.balance[1])}</sup></div>`;
        if (!final.textContent) final.innerHTML = `<div class="elem">${symbol}<sup>${explicitShowPlus(current.balance[2])}</sup></div>`;
        
        if (print == 'balance') return;

        const deltaE = current.deltaElectrons.elem;
        deltaE.classList.add('filled');
        if (!deltaE.textContent) deltaE.innerHTML = `${explicitShowPlus(current.balance[1] - current.balance[2])}${electron}`;
        //если делать длинный баланс - перенести под последний if
        final.classList.add('filled');

        if (print == 'deltaElectrons') return;

        // const deltaEVal = current.deltaElectronsVal.elem.querySelector('.coefficient');
        // console.log(deltaEVal, current.deltaElectronsVal);
        // if (!deltaEVal.textContent) deltaEVal.textContent = current.deltaElectronsVal.correct; 
        //   // deltaEVal.innerHTML = `<div class="coefficient">current.deltaElectronsVal.correct</div>`; 

        // if (print == 'deltaElectronsVal') return;

        const multiplier = current.multiplier.elem.querySelector('.coefficient');
        if (!multiplier.textContent) multiplier.textContent = current.multiplier.correct;

        if (print == 'multiplier') return;                        
      });
    }    
  }
  _activateBalanceOnClick(e) {
    const target = e.target;
    if (!this._editable.some(entry => entry instanceof RedOxBalanceInput)) return;
    this._editable.forEach( inputObj => inputObj.deactivate());
    const clickedOn = this._editable.find(redOxBalanceInputObj => redOxBalanceInputObj.elem.contains(target));
    if (clickedOn) clickedOn.activate(); 
  }
  onTrial(e) {
    console.log('Trial detected');
    this._activateNextRedOXInput();
    //проверка на правильное решение. осуществляется только если решение существует
    super.onTrial();
  }
  //действия по выполнению задания
  onComplete() {
    this.sendCompleteEvent();
    this.set({solution:'none', editable: 'none'});
  }
  _activateNextRedOXInput() {
    console.log(this._editable);
    //если редактируемый элемент - RedOxBalanceInput, то надо автоматически после каждой попытки переносить фокус на следующий незаполненный такой элемент 
    if (!this._editable.some(entry => entry instanceof RedOxBalanceInput)) return; 

    const active = this._editable.find(redoxInputObj => redoxInputObj.active == true)
    active && active.deactivate();
    
    const inactive = this._editable.find(redoxInputObj => redoxInputObj != active && redoxInputObj.active == false && !redoxInputObj.elem.textContent)
    inactive && inactive.activate();     
  }
}