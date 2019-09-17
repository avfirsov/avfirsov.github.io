//общий класс для всех инпутов и коэффициентов,
//и степеней окисления
class ReactionInput  {
  constructor({elem, showCondition}) {
    //элемент, рядом с которым делаем инпут
    [this.elem, this.showCondition] = [elem, showCondition];
  }
  //публичные методы, общие для всех инпутов реакций
  //показывает инпут рядом с элементом
  showInput() {
    //если инпут уже создан в наследнике, нам ловить здесь нечего
    if (this.input) return this.input;
    //создаем инпут, добавляем класс и плейсхолдер
    const input = document.createElement('input');
    //сохраняем инпут в свойство объекта
    this.input = input;
    //связываем свойство this.value с this.input.value (чтобы код был короче)
    Object.defineProperty(this, 'value', {
      get: function() { return this.input.value; },
      set: function(newValue) { this.input.value = newValue; },
      enumerable: true,
      configurable: true
    });
    //чтобы работали обработчики, сохраним в замыкании:
    const self = this;
    //сохраняем ссылки на функции с биндом, чтобы потом удалить слушаетелей 
    this.__onInputKeyDown = self._onInputKeyDown.bind(self);
    this.__onChangeValue = self._onChangeValue.bind(self);
    this.__onWheel = self._onWheel.bind(self)
    //добавляем общий обработчик всех вводов в инпут
    input.addEventListener('keydown', this.__onInputKeyDown);
    input.addEventListener('input', this.__onChangeValue);
    input.addEventListener("paste", preventPasteSelect);
    //в любом инпуте должно работать колесико
    input.addEventListener('wheel', this.__onWheel);
    
    if (this.showCondition == 'onclick') { 
      this.__onDocClick = self._onDocClick.bind(self);
      setTimeout(function(){
        document.addEventListener('click', self.__onDocClick);
        self.input.focus();
      }, 0);
    }

    return input;
  }

  // создает стрелки увеличения и уменьшения значения инпута
  createControls() {
    //если инпут еще не создан в наследнике, нам ловить здесь нечего
    if (!this.input) return;
    //если элементы управления уже есть, здесь нам делать нечего
    if (this._increaseElem || this._decreaseElem) return;
    const self = this;
    const input = this.input;
    //создаем кнопки увеличения и уменьшения значения (увеличитель и уменьшитель)
    const increaseElem = document.createElement('div');
    const decreaseElem = document.createElement('div');
    //добавляем класс .button обоим кнопкам
    //для всех элементов этого класса запрещено их выделение
    increaseElem.classList.add('button'); 
    decreaseElem.classList.add('button'); 
    //создаем DIV в который поместим инпут вместе с кнопками, с display: inline 
    const container = document.createElement('div');
    container.className = "reactionInput";
    this._container = container;
    //создаем DIV внутри container с display:flex
    const controls = document.createElement('div');
    controls.className = "inputControls";
    //вставляем перед инпутом контейнер, в него - див с контролами, потом туда же перемещаем инпут
    input.before(container);
    container.append(controls);
    controls.append(input);
    //вставляем в документ перед и после инпута
    input.after(decreaseElem);
    input.before(increaseElem);
    //делаем приватную ссылку на увеличитель
    this._increaseElem = increaseElem;
    this._decreaseElem = decreaseElem;
    //сохраняем ссылки на привязанные фукнции чтобы потом корректно удалить слушателей
    this.__increaseValueBtn = self._increaseValueBtn.bind(self);
    this.__decreaseValueBtn = self._decreaseValueBtn.bind(self);
    //"оживляем" кнопки увеличитель и уменьшитель, а также предотвращаем случайное выделение
    increaseElem.addEventListener('click', this.__increaseValueBtn);
    decreaseElem.addEventListener('click', this.__decreaseValueBtn);
  }
  // вызывается всегда, когда нажата клавиша.
  // позволяет ввести только цифру
  _onKeyPress(e) {
    e = e || event;
    const chr = getChar(e);
    if (e.ctrlKey || e.altKey || chr == null) return; // специальная клавиша
    if (chr < '0' || chr > '9') {
      e.preventDefault();
    }
    //сохраненка для текущего значения
    this._checkCurrentValue();
  }
  //увеличивает/уменьшает значение инпута при нажатии на стрелки на клавиатуре
  _onInputKeyDown(e) {
    const input = this.input;
    if (e.keyCode == 13) {
      const self = this;
      if (this.showCondition == 'always') return;
      this.sendTrialEvent();
      setTimeout(self.hide.bind(self), 0);  
    }
    //нажата стрелка вверх
    if (e.keyCode == 38) {
      input.value++;
      this._onChangeValue();
    }
    //нажата стрелка вниз
    if (e.keyCode == 40) {
      input.value--;
      this._onChangeValue();
    }
  }
  //увеличивает/уменьшает значение инпута при вращении колесика
  _onWheel(e) {
    const input = this.input;
    if (e.deltaY < 0) {
      input.value++;
    } else input.value--;
    this._onChangeValue();
    e.preventDefault();
    return false;
  }
  //обработчики для нажатия на стрелку
  //увеличивает значение на 1, если инпут не заблокирован и отправляет значение на проверку
  //у каждого типа инпута своя проверка
  _increaseValueBtn() {
    const input = this.input;
    if (!input.disabled) input.value = +input.value + 1;
    this._onChangeValue();
  }
  //уменьшает значение на 1, если инпут не заблокирован и отправляет значение на проверку
  _decreaseValueBtn() {
    const input = this.input;
    if (!input.disabled) input.value = +input.value - 1;
    this._onChangeValue();
  }
  //вызывается всегда, когда меняется значение инпута любым путем - стрелка или ручной ввод
  _onChangeValue() {
    this._checkCurrentValue();
    //и отправляем результат нового "правильного" значения событием
    const self = this;
    //если текущий инпут из числа постоянного редактирования - через 0.2 с после последней правки в инпутах
    //отправить событие trial для проверки правильности решения. 
    //отправляем именно через 0.2 с после самой последней правки. Т.е. если пользователь начал снова 
    //что-то вводить - отменяем отправку. Задержка в 0.2 сделана по соображениям красоты.
    if (this.showCondition == 'always') {
      if (this._trialTimer) clearTimeout(this._trialTimer);
      this._trialTimer = setTimeout(self.sendTrialEvent.bind(self), 200);
    }
  }
  _checkCurrentValue() {
    return
  }
  //вызывается только для временных инпутов
  //проверяет, не кликнули ли мимо нашего инпута, если кликнули - скрывает его
  _onDocClick(e) {
    const target = e.target;
    const self = this;
    //если клик попал в элемент инпута, отбой, скрывать не надо
    if (this.elem.contains(target)) return;
    console.log(self, this, this.__onDocClick);
    setTimeout(self.sendTrialEvent.bind(self), 0);
    document.removeEventListener('click', this.__onDocClick);   
    this.hide();
  }
  disable() {
    const input = this.input
    if (input) {
      input.disabled = true;
      blockElem(input);
      //удаляем слушателей с инпута и сам инпут
      input.removeEventListener('keydown', this.__onInputKeyDown);
      input.removeEventListener('input', this.__onChangeValue);
      input.removeEventListener('wheel', this.__onWheel);
      input.removeEventListener("paste", preventPasteSelect);
    }
    const increaser = this._increaseElem;
    const decreaser = this._decreaseElem;
    if (increaser && decreaser) {
      [increaser, decreaser].forEach(elem => {
        blockElem(elem);
        elem.removeEventListener('click', this.__increaseValueBtn);
        elem.removeEventListener('click', this.__decreaseValueBtn);
      });
    }
  }

  enable() {
    const input = this.input
    if (input) {
      input.disabled = false;
      unblockElem(input);
      //удаляем слушателей с инпута и сам инпут
      input.addEventListener('keydown', this.__onInputKeyDown);
      input.addEventListener('input', this.__onChangeValue);
      input.addEventListener('wheel', this.__onWheel);
      input.addEventListener("paste", preventPasteSelect);
    }
    const increaser = this._increaseElem;
    const decreaser = this._decreaseElem;
    if (increaser && decreaser) {
      [increaser, decreaser].forEach(elem => {
        unblockElem(elem);
        elem.addEventListener('click', this.__increaseValueBtn);
        elem.addEventListener('click', this.__decreaseValueBtn);
      });
    }
  }
  toggle() {
    if (!this.input.disabled) this.disable();
    else this.enable();
  }
  //удаляет инпут и всех наблюдателей
  hide() {
    if (!this.input) return;
    //удаляем слушателей с инпута и сам инпут
    this.input.removeEventListener('keydown', this.__onInputKeyDown);
    this.input.removeEventListener('input', this.__onChangeValue);
    this.input.removeEventListener('wheel', this.__onWheel);
    this.input.removeEventListener("paste", preventPasteSelect);
    this.input.remove();
    delete this.input;
    //если были созданы кнопки управления - удаляем их
    if (this._increaseElem && this._decreaseElem) {
      this._increaseElem.removeEventListener('click', this.__increaseValueBtn);
      this._increaseElem.removeEventListener('selectstart', preventPasteSelect);
      this._decreaseElem.removeEventListener('click', this.__decreaseValueBtn);
      this._decreaseElem.removeEventListener('selectstart', preventPasteSelect);
      this._container.remove();
      delete this._increaseElem; 
      delete this._decreaseElem;
      delete this._container;
      return;
    }
  }
  //метод для временных инпутов. вызывается при клике мимо инпута и пряет ипнут с созранением его значения
  hideOnClick(e) {
    console.log(e, e.target, this, this.input);
    if (!this._container.contains(e.target)) {
      const self = this;
      //для временных инпутов, событие Trial отправлять только после того, как пользователь ввел значение и нажал куда-то мимо инпута (=сохранил ввод)
      //setTimeout делаем для того, чтобы после убирания инпута успел появится блок с тем, что ввели в инпут. Вообщем, по соображениям красоты 
      if (this.showCondition == 'onclick') setTimeout(self.sendTrialEvent.bind(self), 0);   
      this.hide();
      document.removeEventListener('click', this.__hideOnClick);
    }
  }
}



//создаем предка инпута реакции - инпут ввода коэффициентов
class CoefInput extends ReactionInput{
  constructor(options) {
    super(options);
  }
  //самый главный метод - показать инпут с вводом коэффициента
  showInput() {
    const self = this;
    //вызываем метод родителя, который связывает this.value жестко с input.value
    const input = super.showInput();
    input.placeholder = "1";
    //если у вещества стоит коэффициент - берем значение из него,
    //коэффициент скрываем, а вместо него - показываем инпут с его значением
    const currentCoef = this.elem.querySelector('.coefficient');
    //сохраняем значение текущего коэффициента и удаляем DIV с текущим коэффициентом
    if (currentCoef) {
      input.value = currentCoef.textContent;
      currentCoef.remove();
    } else {
      input.value = 1;
    }
    //вставляем инпут перед текущим <.compound>
    this.elem.prepend(input);
    //вызываем метод родителя по созданию кнопок увеличения-уменьшения
    super.createControls();
    //добавляем контейнеру класс для навигации и стилей
    this._container.classList.add("coefInput");
    this._checkCurrentValue();
    //сохраняем ссылки на привязанные фукнции чтобы потом корректно удалить слушателей
    this.__onKeyPress = self._onKeyPress.bind(self);
    this.__onBlur = self._onBlur.bind(self);
    //добавляем наблюдателей.  
    //Любой ввод будет отправлять событие trial 
    this.input.addEventListener('keypress', this.__onKeyPress);
    this.input.addEventListener('blur', this.__onBlur);
    //делаем так, что если оставили поле пустым и покинули - в него вводится знач по умолчанию - 1
  }
  //выполняет проверку текущего значения инпута и делает действия в зависимости от него
  //например, блокирует кнопки увеличения-уменьшения, если надо
  _checkCurrentValue() {
    const input = this.input;
    //нельзя чтобы в инпуте был введен "0" просто так
    //но ноль можно получить в инпуте тремя путями:
    //1) вводом с клавы, когда поле пустое (тогда сэйв == "") 
    //2) выделить текущий текст и ввести "0", тогда сэйв может быть любым
    //3) стрелками, кнопками, колесиком.. - тогда мы точно пройдем через 1 и прошлое значение будет 1.
    //в этом случае, проверки ниже вернут прошлое годное значение, т.е. 1
    //код непосредственно ниже - именно для случаев 1) и 2), а случай 3) решается кодом ниже
    if (input.value === "0" && this._save != 1) {
      input.value = "";
      this._checkCurrentValue();
      return;
    }
    //нельзя, чтобы значение перевалило за 99
    //перевалить может двумя путями: 1) кликом по кнопке вверх (в этом случае разность с прошлым значением составит 1, 
    //а само прошлое доппустимое значение составит 99)
    //2) вводом с клавиатуры. в этом случае разница с прошлым значением значением может быть любой, как и само прошлое значение
    //поэтоум в этом случае просто воскрешаем прошлое значение 
    if (input.value > 99) {
      input.value = (input.value - this._save) > 1 ? this._save : 99;
    }
    //нельзя, чтобы значение стало меньше 1
    //перевалить может двумя путями: 1) кликом по кнопке вверх (в этом случае разность с прошлым значением составит 1, 
    //а само прошлое доппустимое значение составит 1)
    //2) вводом с клавиатуры. в этом случае разница с прошлым значением значением может быть любой, как и само прошлое значение
    //поэтоум в этом случае просто воскрешаем прошлое значение 
    if (input.value < 1 && input.value != "") {
      input.value = (input.value - this._save) < -1 ? this._save : 1;
    }
    //если текущее значение достигло 1 - заблокировать уменьшитель
    if (this.value <= 1) {
      if (!this._decreaseElem._disabled) blockElem(this._decreaseElem);
    } else {
      console.log(this._decreaseElem._disabled);
      if (this._decreaseElem._disabled) unblockElem(this._decreaseElem);
    }
    //аналогично с 99 для увеличителя
    if (this.value >= 99) {
      if (!this._increaseElem._disabled) blockElem(this._increaseElem);
    } else {
      if (this._increaseElem._disabled) unblockElem(this._increaseElem);
    }
    //по итогам всех проверок, в поле должно быть "правильное" значение.
    //сохранеяем его 
    this._save = input.value;
  }
  //свой обработчик блюра, нельзя чтобы поле оставалось незаполненным в случае потери фокуса 
  _onBlur(e) {
    const input = this.input;
    if (!input) return;
    if (input.value === "") input.value = "1";
    this._onChangeValue();
  }
  //на всякий случай, удаляем с элемента всех наблюдателей
  hide() {
    const input = this.input;
    if (!input) return;
    //удаляем наблюдателей  
    input.removeEventListener('keypress', this.__onKeyPress);
    input.removeEventListener('blur', this.__onBlur);
    // если в инпут ничего не введено, или введена единица - не показываем коэффициент вместо инпута
    // иначе - на месте инпута создаем DIV.coefficient со значением инпута
    if (input.value > 1) {
      const coefficient = document.createElement('div');
      coefficient.className = "coefficient";
      coefficient.textContent = this.input.value;
      this._container.before(coefficient);
    }
    super.hide();
  }
}


class OxiStateInput extends ReactionInput{
  constructor(options) {
    super(options);
    //нижний и верхний пределы допустимых значений с.о. 
    this._lowLimit = -4;
    this._topLimit = 7; 
  }
  //показать инпут
  showInput() {
    const self = this;
    //вызываем метод родителя, который связывает this.value жестко с input.value
    const input = super.showInput();
    input.placeholder = "+1";
    //вызываем метод родителя по созданию кнопок увеличения-уменьшения
    super.createControls();
    //добавляем контейнеру класс для навигации и стилей
    this._container.classList.add("oxiStateInput");
    //степень окисления, если есть, хранится в <sup>.
    const currentOxiState = this.elem.querySelector('sup');
    //если степень окисления прописана - берем ее, и в ее <sup> помещаем наш инпут
    //если ее нету - создаем <sup>-контейнер и туда помещаем инпут 
    //в контейнере с электронами также есть свой sup, поэтому проверяем, что sup не из контейнера электронов
    if (currentOxiState && !currentOxiState.closest('.electrons')) {
      input.value = currentOxiState.textContent;
      currentOxiState.textContent = "";
      currentOxiState.append(this._container);
    } else {
      const sup = document.createElement('sup');
      sup.append(this._container);
      this.elem.firstChild.after(sup);  
    }
    this.__onKeyPress = self._onKeyPress.bind(self);
    this.input.addEventListener('keypress', this.__onKeyPress);
    this._checkCurrentValue();
  }
  //логика работы обработчика нажатия клавиш такая:
  // 1) если поле пустое - можно вводить только '+', '-', '0'
  // 2) если в поле содержится знак:
  //  а) если ничего не выделено: можно вводить только число (любое, включая 0) (это ограничение осуществляется обработчиком родителя - super._onKeyPress())
  //  б) если выделен знак: можно только знаки или 0 (как в пустое поле)
  // 3) если в поле '0':
  //  а) если ничего не выделено: ничего нельзя вводить
  //  б) если выделен 0: ввод как в пустое поле
  // 4) если в поле полная запись степени окисления:
  //  а) если ничего не выделено: ничего нельзя вводить
  //  б) если выделен знак: ввод как в пустое поле
  // Все эти правила гарантируют что в поле не будет введена с клавиатуры некорректная запись степени окисления     
  _onKeyPress(e) {
    e = e || event;
    const char = getChar(e);
    console.log(this.input.value, char);
    const selection = document.getSelection().toString();
    const value = this.input.value;

    if (!selection && !isNaN(value) && value != '') {
      console.log('first if', !selection, !isNaN(value), value != '');
      e.preventDefault();
      return;
    }
    if ((!value ||
        (selection.includes('-') || selection.includes('+') || selection.includes('0'))) &&
        !(char == '+' || char == '-' || (char == '0' && (selection == value))) ) {
      console.log('second if', !value, selection.includes('-') || selection.includes('+') || selection.includes('0'), !(char == '+' || char == '-' || (char == '0' && (selection == value))));
      e.preventDefault();
      return;
    }
    if (char == '+' || char == '-') {
      console.log('thrid if', value, selection, char);
      return;
    }
    console.log('none of if', value, selection, char);
    super._onKeyPress();
  } 
  //После ввода в поле, запускается обработчик для более глубокой проверки на адекватность введенной степени окисления
  //Делает следующее:
  //  1) если в поле была введена степень окисления и стерли знак - заменить знак на противоположный
  //  2) если в поле вдруг оказалось число без знака - добавляем перед числом знак '+'
  //  3) если число в поле вышло за рамки допустимых значений величин степеней окисления - приравнять к ближайшему допустимому значению
  //  4) последнее корректное значение степени окисления в поле сохраняется в this._save
  _checkCurrentValue() {
    const input = this.input;
    //если в поле еще не введено число - отбой, проверка не нужна
    if (isNaN(input.value) || input.value == '') return;
    //нижний и верхний пределы допустимых значений с.о. 
    const lowLimit = this._lowLimit;
    const topLimit = this._topLimit; 
    console.log(input.value, this._save);
    // если стереть знак в инпуте, то инпут наполняется таким же числом, взятым с обратным знаком
    // про условие в if: если стерли знак, то в поле остается голое число без знака, но при этом в сохраненке остается то же число, только со знаком
    // важный нюанс: альтернативные способы ввода - клавишы вверх-вниз, стрелки над и под инпутом, колесико мышки берут текущее значение в поле, отбрасывают знак,
    // и увеличивают/уменьшают оставшееся число на 1. Т.е. если было в поле '+1' то станет '0' или '2', при этом в сохраненке будет '+1', т.е. новое значение инпута 
    // не совпадает по модулю с сохраненкой, поэтому альтернативные контролы не триггерят это условие 
    if (!(input.value.includes('-') || input.value.includes('+')) && (parseInt(this._save) == parseInt(input.value))) {
      console.log('trigged');
      input.value = -1 * this._save;
      console.log(input.value, this._save);
    }
    //после смены знака с минуса на плюс, в поле окажется число без знака, т.е. '-1' превратиться в '1', а надо чтобы было '+1'
    //поэтому, если такая ситуация возникла, дописываем '+'
    input.value = addPlus(input.value);
    console.log(input.value);
    //нельзя, чтобы значение перевалило за topLimit
    //при попытках перейти останавливаем на topLimit
    if (input.value > topLimit) {
      input.value = topLimit;
    }
    //нельзя, чтобы значение стало меньше low limit 
    if (input.value < lowLimit) {
      input.value = lowLimit;
    }
    //если текущее значение достигло lowLimit - заблокировать уменьшитель
    if (input.value <= lowLimit) {
      if (!this._decreaseElem._disabled) blockElem(this._decreaseElem);
    } else {
      console.log(this._decreaseElem._disabled);
      if (this._decreaseElem._disabled) unblockElem(this._decreaseElem);
    }
    //аналогично с topLimit для увеличителя
    if (input.value >= topLimit) {
      if (!this._increaseElem._disabled) blockElem(this._increaseElem);
    } else {
      if (this._increaseElem._disabled) unblockElem(this._increaseElem);
    }
    //дописываем знак для положительной степени окисления, если надо
    console.log(input.value);
    input.value = addPlus(input.value);
    //по итогам всех проверок, в поле должно быть корректное значение.
    //сохранеяем его 
    this._save = input.value;
    console.log('saving ',this._save);
    //и отправляем результат нового "правильного" значения событием (только для всегда редактируемых)
    const self = this;
    //дописывает знак '+' где нужно
    function addPlus(value) {
      if (value > 0 && value[0] != "+") {
        console.log(value);
        return `+${value}`;
      }
      else return value;
    }
  }
  //увеличивает значение на 1, если инпут не заблокирован и отправляет значение на проверку
  _increaseValueBtn() {
    this._signToValue();
    super._increaseValueBtn();
  }
  //уменьшает значение на 1, если инпут не заблокирован и отправляет значение на проверку
  _decreaseValueBtn() {
    this._signToValue();
    super._decreaseValueBtn()
  }
  //из "+" делаем "+1", из "-" -1
  //это нужно для корректного увеличения/уменьшения значения стрелкой 
  _signToValue() {
    const input = this.input;
    if (input.value == "-") {
      input.value = -1;
      this._save = -1;
    }
    if (input.value == "+") {
      input.value = 1;
      this._save = 1;
    }  
  }
  //на всякий случай, удаляем с элемента всех наблюдателей
  hide() {
    const input = this.input;
    if (!input) return;
    //удаляем наблюдателей
    input.removeEventListener('keypress', this.__onKeyPress);
    // если в инпут ничего не введено, или введена единица - не показываем вместо инпута ничего
    // иначе - на месте инпута создаем sup со значением инпута
    const sup = this._container.closest('sup');
    console.log('sup ', sup);
    if (!isNaN(this.input.value)) {
      sup.textContent = this.input.value;
      super.hide();
    } else {
      super.hide();
      sup.remove();
    }
  }
}

class ReactionInputsManager {
  constructor() {
    this.showInputWhenClicked = new Map();
    //уже показываемые инпуты
    this.inputsShown = [];
    // this.activeElements = new Map();
    this.active = 'false';
  }
  initiate() {
    if (this.active == 'true') return;
    
    const self = this;
    self.clicksListener = onClick.bind(this); 
    document.addEventListener('click', self.clicksListener);
    
    function onClick(e) {
      const target = e.target;
      const elem = [...this.showInputWhenClicked.keys()].find(clickableElem => clickableElem.contains(target));
      if (!elem) return;

      //убираем из списка активных инпутов те, которые уже не показываются
      this.inputsShown = this.inputsShown.filter( inputObj => inputObj.input);
      //и проверяем, нет ли среди показываемых инпутов нашего
      if (this.inputsShown.find(inputObj => inputObj.elem == elem)) return;

      const inputType = this.showInputWhenClicked.get(elem);
      
      let input;
      if (inputType == 'oxiState') input = new OxiStateInput({elem:elem, showCondition: 'onclick'});
      else if (inputType == 'coef') input = new CoefInput({elem:elem, showCondition: 'onclick'}); 
      input.showInput();
      
      this.inputsShown.push(input);
    }
    this.active == 'true'
  }
  addClickableElem({elem, inputType}) {
    this.showInputWhenClicked.set(elem, inputType)
  }
  removeClickableElem(elem) {
    const removableInputObj = this.inputsShown.find(inputObj => inputObj.elem == elem);
    if (removableInputObj) removableInputObj.hide(); 
    this.showInputWhenClicked.delete(elem); 
  }
}