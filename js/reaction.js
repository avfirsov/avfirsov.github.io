/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// класс для объекта реакции или формулы                                                                                   //
// обязательный параметр options.elem - DOM следующего формата:                                                         // //
// 1) реакция или формула в родителе с классом 'reaction'                                                               // //
// 2) все вещества находятся в DIV.compound                                                                             // //
// 3) коэффициент вещества находится либо в DIV.coefficient (если != 1) - первом дочернем элементе DIV.compound,        // //
//  либо в '.coefInput input', если происходит редактирование. Если коэффициент равен 1 и не происходит редактирование, // //
//  DIV.coefficient отсутствует                                                                                         // //
// 4) все элементы находятся в DIV.elem                                                                                 // //
// 5) все степени окисления находятся 'sup'                                                                             // //
// 6) все индексы находятся в 'sub'                                                                                     // //
// 7) круглые и квадратные скобки находятся в текстовых узлах между DIV.elem, внутри DIV.compound                          //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Reaction extends Exercize {
  constructor(options) {
    super(options);
  }

  // возобновляет режим редактирования для объектов инпутов из alwaysEditable
  continueEdit() {
    this._alwaysEditable.forEach( x => x.enable());
  }
  
  // очищает список элементов, для которых вызывается редактор по клику 
  // (и таким образом предотвращает редактирование по клику), а также
  // выключает редактируемость для объектов инпутов из alwaysEditable
  stopEdit() {
    this._editableOnClick.length = 0;
    //возможно, здесь надо будет сделать, чтобы инпуты сворачивались,
    //а не просто оставались нередактируемыми
    this._alwaysEditable.forEach( x => x.disable());
  }
  //думаю, этот метод не понадобится
  toggleEdit() {}
  //эти методы необязательны, их сделать в самом конце
  clearCoeffs() {}
  clearOxiStates() {}

  //конвертирует строку с текстом реакции в разметку по следующим правилам:
  // ========> добавить сюда перечень правил
  layout() {
    if (this.elem.children.length > 0) {
      console.warn("В этой реакции уже присутствуют элементы. Разметка будет пропущена", this.elem);
      return;
    }  
    //берем текст реакции, убираем из него пробелы и делаем массивом символов
    const reactionTxt = this.elem.textContent.replace(/\s+/g, '');
    const reactionArr = [...reactionTxt];
    //объявляем флаги. Когда начинается парсинг соотв. элемента уравнения - поднимается соотв
    //флаг. Когда парсинг заканчивается - флаг опускается. 
    let inCoef,
        inCompound,
        inElem,
        inCharge,
        alreadyHasCharge; 

    flagsDown();

    console.groupCollapsed('Размечиваю реакцию');
    console.log('Размечиваю реакцию:', this.elem, reactionTxt, reactionArr);

    //в этом массиве будем хранить результат
    let reactionLayoutArr = [];
    reactionLayoutArr = reactionArr.map( (current,i, reactionArr) => {
      //когда будет закрываться открытый тэг, сюда будет помещаться текст </TAG>, 
      //а потом это будет добавляться к текущему элементу
      let closure = "";
      //конец коэффициента - это когда мы парсим коэффициент и текущее - не число
      if (isNaN(current) && inCoef) {
        console.log(`current , i, массив до текущего i: ${current} ${closure} ${i} ${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}]}` );

        inCoef = false;
        // reactionArr[i-1] += "</div>";
        closure = "</div>"; //закрываем div.compound конца
        
        console.log(`current , i, массив до текущего i: ${current} ${closure} ${i} ${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}]}` );
        console.groupEnd("Начало коэффициента");
      }
      //Стрелка символизирует конец реагентов и начало продуктов. 
      //Опускаем все флаги
      //Стрелке добавляем пробелы слева и справа от нее 
      if (current == ARROW) {
        console.groupCollapsed("Стрелка");
        console.log(`current , i, массив до текущего i: ${current} ${closure} ${i} ${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}]}` );
        
        //если не закрыты текущие теги элемента и вещества - закрываем
        if (inElem) closure += "</div>";
        if (inCompound) closure += "</div>";
        flagsDown();
        
        console.groupEnd("Стрелка");
        
        return `${closure} ${current} `;
      }
      //начало заряда 
      if (current == "(" && ifNoLatinLater(i, reactionArr)) {
        console.groupCollapsed("Начало заряда");
        console.log(`current , i, массив до текущего i: ${current}  ${closure}${i} ${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge, alreadyHasCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}, ${alreadyHasCharge}]}` );
        
        inCharge = true;
        console.groupEnd("Начало заряда");
        if (alreadyHasCharge) {
          closure = `</div>`;
          inElem = false;
        }
        return `${closure}<sup>`;
      }
      //конец заряда
      if (current == ")" && inCharge) {
        console.groupCollapsed("Конец заряда");
        console.log(`current , i, массив до текущего i: ${current}  ${closure}${i} ${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge, alreadyHasCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}, ${alreadyHasCharge}]}` );
  
        inCharge = false;
        console.log('alreadyHas!', current, i);
        alreadyHasCharge = true;

        console.groupEnd("Конец заряда");
  
        return `${closure}</sup>`;
      }
      //конец вещества
      if (current == "+" && !inCharge) {
        console.groupCollapsed("Конец вещества");
        console.log(`current , i, массив до текущего i: ${current} ${closure} ${i} ${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge, alreadyHasCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}, ${alreadyHasCharge}]}` );
        
        // если последний элемент еще не закрыт, закрываем его.
        if (inElem) closure += "</div>";
        flagsDown();
  
        console.groupEnd("Конец вещества");
        return `${closure}</div> + `;
      }
      //конец элемента
      if (inElem && isCapitalLatin(current) || 
          inElem && isNaN(current) && !inCharge && !isLatin(current)) {
        console.groupCollapsed("Конец элемента");
        console.log(`current , i, массив до текущего i: ${current} ${i} ${closure} ${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge, alreadyHasCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}, ${alreadyHasCharge}]}` );
        
        inElem = false;
        alreadyHasCharge = false
        closure = "</div>";
        
        console.log(`current , i, массив до текущего i: ${current} ${i}  ${closure}${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge, alreadyHasCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}, ${alreadyHasCharge}]}` );
        console.groupEnd("Конец элемента");
        }
      //индекс (может состоять только из одного символа, поэтому для него отдельный флаг не заводим)
      if (!isNaN(current) && inCompound && !inCharge && !inCoef) {
        console.groupCollapsed("Индекс");
        console.log(`current , i, массив до текущего i: ${current} ${i} ${closure} ${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge, alreadyHasCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}, ${alreadyHasCharge}]}` );
        console.groupEnd("Индекс");
        
        return `${closure}<sub>${current}</sub>`;
      }
      //начало вещества
      if (!inCompound) {
        console.groupCollapsed("Начало вещества");
        console.log(`current , i, массив до текущего i: ${current} ${i}  ${closure}${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge, alreadyHasCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}, ${alreadyHasCharge}]}` );
        
        inCompound = true;
        closure = '<div class="compound">'; 

        console.log(`current , i, массив до текущего i: ${current} ${i}  ${closure}${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge, alreadyHasCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}, ${alreadyHasCharge}]}` );
        
        if (!isNaN(current)) {
          inCoef = true;
          console.groupEnd("Начало вещества");
          console.groupCollapsed("Начало коэффициента");

          return `${closure}<div class="coefficient">${current}`
        }
        console.groupEnd("Начало вещества");
      } 
      //начало элемента
      if (inCompound && !inElem && isCapitalLatin(current)) {
        console.groupCollapsed("Начало элемента");
        console.log(`current , i, массив до текущего i: ${current} ${i}  ${closure}${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge, alreadyHasCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}, ${alreadyHasCharge}]}` );
        console.groupEnd("Начало элемента");
        
        inElem = true;
        return `${closure}<div class="elem">${current}`;
      }
      //действие по умолчанию - оставить текущий символ как есть
      console.groupCollapsed("Действие по умолчанию");
      console.log(`current , i, массив до текущего i: ${current} ${i}  ${closure}${reactionLayoutArr.slice(0, i).join("")} flags: [inCoef, inCompound, inElem, inCharge, alreadyHasCharge] =  ${inCoef}, ${inCompound}, ${inElem}, ${inCharge}, ${alreadyHasCharge}]}` );
      console.groupEnd("Действие по умолчанию");
      return closure + current;
    });
    
    //заменяем внутренний HTML DIV.reaction на сгенерированный HTML
    this.elem.innerHTML = reactionLayoutArr.join("");

    console.log('Результирующий HMTL: ', reactionLayoutArr.join(""));
    console.log('HTML внутри DIV.reaction', this.elem.innerHTML); 
    console.groupEnd('Размечиваю реакцию');

    //вспомогательные функции

    function flagsDown() {
      [inCoef, inCompound, inElem, inCharge, alreadyHasCharge] = [false, false, false, false, false];
    }

    //функция, определяющая что означает текущая открывающая скобка - 
    //заряд это или скобка для элементов
    //Определяем так: для зарядов в скобках не должно быть 
    //латинских букв. 
    function ifNoLatinLater(i, reactionArr) {
      //ищем закрывающую скобку
      let endBracket = reactionArr.indexOf(")", i);
      console.log(`endBracket = ${endBracket}, elem = ${reactionArr[endBracket]}`);
      //если не нашли - значит ошибка разметки реакции, скобку не закрыли
      if (!~endBracket) {
        console.error(`Ошибка! Не могу найти закрывающую скобку для ${reactionArr[i]}. i = ${i}, reactionArr после i: ${reactionArr.slice(i)}`);
        endBracket = reactionArr.length - 1;
      }
        const beforeEndBracket = reactionArr.slice(i + 1, endBracket);
        return !beforeEndBracket.some( symbol => isLatin(symbol) );
    }
  }
  buildReactionTree() {
    console.groupCollapsed('Создаю ReactionTree');

    this.reactionTree = new ReactionTree(this);
    this.reactionTree.make();

    console.groupEnd('Создаю ReactionTree'); 
  }
  //самый важный метод - наполняет состояние реакции по options
  ///////////////////////////////////////////////////////////////////////////
  // ПРИНЦИПЫ ЗАДАНИЯ OPTIONS:
  // 1) Можно задавать то, что нужно решить: options{solution: []}
  // 2) Можно задавать то, что можно редактировать: options{editable: []}
  // Одновременно можно редактировать только или коэффициент(ы), или степень(и) окисления
  // Если что-то указано в solution, но не указано в editable - в editable будет 
  // автоматически добавлена соответствующая запись чтобы нужный элемент редактировался.
  // Если нужно, editable будет переписан (например, в solution коэффициенты, а в 
  // editable - степени окисления. В этом случае editable будет переписан так, чтобы
  // в нем были коэффициенты).                          
  ///////////////////////////////////////////////////////////////////////////
  set(options) {
    console.groupCollapsed('Setting options for reaction', this, options);
    console.log(options, options instanceof Object, options.editable, options['editable']);
    //если еще нет разметки - размечаем
    if (this.elem.children.length < 1) this.layout();
    //если еще не создано ReactionTree - создаем, иначе - обновляем 
    if (!this.reactionTree) 
      this.buildReactionTree();
    // } else this.reactionTree.refresh();
    const reactionTree = this.reactionTree;
    //опция editable будет дополняться в set(solution) так, чтобы все, что подразумевает правильное решение
    //редактировалось, поэтому задаем через let
    let editable = options.editable;
    const solution = options.solution;
    const electrons = options.electrons;
    
    //////////////////////////////////////////////////////////////////////////////////////////////////
    //в 3 функциях ниже я привязывал их к this, хотя мог бы просто в них всех заменить this на self //
        //(проверить, может можно без привязки и без self)                                              //
    //////////////////////////////////////////////////////////////////////////////////////////////////

    //задаем критерии правильного решения, если таковое существует
    //общий принцип таков: сначала задаем решение. В процессе задания решения, все что имеет правильный ответ - 
    //должно обязательно быть редактируемым. Поэтому setSolution при необходимости дописывает options, или даже
    //переписывает с нуля, так, чтобы точно обеспечить редактируемость критичных параметров
    console.groupCollapsed('Setting electrons ', electrons);

    setElectrons.bind(this)(electrons);

    console.groupEnd('Setting electrons ', electrons);

    console.groupCollapsed('Searching for solution.. ', options['solution']);
    
    setSolution.bind(this)(solution);

    console.groupEnd('Searching for solution.. ', options['solution']);
    
    console.groupCollapsed('Searching for editable.. ', options['editable']);
    
    //устанавливаем опция editable
    setEditable.bind(this)(editable);
    
    console.groupEnd('Searching for editable.. ', options['editable']);

    const self = this;
    //если есть что редактировать по клику, настраиваем чтобы это кликалось
    if (this._editableOnClick && this._editableOnClick.length > 0) {
      this._editableOnClick.forEach(elem => {
        const inputType = elem.classList.contains('compound') ? 'coef' : 'oxiState';
        reactionInputsManager.addClickableElem({elem, inputType});
      });
    }
    //устанавливаем обработчик на ввод пользователем любых данных
    //на событие onTrial (метод родительского класса Exercize)
    this.activate();
    console.groupEnd('Setting options for reaction', this, options);
    //вспомогательные функции
    //отображает над указанными элементами нужное число электронов: сколько атом принял или отдал электронов в реакции
    //формат объекта electrons:{%formula%:{%symbol%: %Number%}}.
    //у любого вещества можно задать электроны для любого элемента  
    function setElectrons(electrons) {
      if (!electrons) return;

      [...electrons].forEach(formula => {
        const symbols = electrons[formula];
        
        [...symbols].forEach(symbol => {
          const elementObj = this.reactionTree.symbolToElemObj(symbol, formula);
          const elementDOM = elementObj.elem;
          if (!elementDOM) return;

          const electronsVal = explicitShowPlus(symbols[symbol]); 

          const electronsDOM = document.createElement('div');
          electronsDOM.classList.add('electrons');
          electronsDOM.innerHTML = `${electronsVal}${electron}`;
          
          //в css у класса .electrons стоит position:absolute
          //если делать position:relative, то в формуле появляюстя некрасивые
          //пробелы в элементах, для которых заданы электроны, выглядит некрасиво, 
          //поэтому используем position:absolute. Важный нюанс: при этому у родительского DOM - 
          //elementDOM, стоит position:relative, иначе при изменении размеров страницы
          //эти элементы будут разлетаться по странице в разные стороны
          electronsDOM.style.top = -20 + 'px';
          electronsDOM.style.left = -5 + 'px';

          elementDOM.append(electronsDOM);

          elementObj.deltaElectrons = parseInt(electronsVal);
        });
      });
    }
    //задает критерии правильного решения 
    //общий прицип работы setEditable:
    //Общие положения:
    //1. нельзя требовать одновременного подбора степени окисления и коэффициента - 
    //или то, или то, т.к. нельзя одновременно задавать редактируемость обоих полей
    //Возможные значения параметра solution:
    // 1) solution = "coeffsAll" - все коэффициенты должны быть расставлены правильно
    // 2) solution =  "oxiStatesAll" - все степени окисления должны быть расставлены правильно
    // и это "правильно" находится программным образом. Это то, что надо будет сделать позже
    //установка "все коэффициенты должны быть правильными"
    // 3) solution = {KMnO4:4, SO2:3} - коэффициенты перед KMnO4 и SO2 - соответствующие числа
    // 2) solution = {KMnO4: 'coeff'} - для ответа надо ввести правильный коэффициент перед KMnO4 
    // 3) solution = {KMnO4: 'oxiStates'} - для ответа надо ввести все правильно все степени окисления)  
    // 4) solution = {KMnO4: ['K', 'Mn']} - для ответа надо ввести правильно степени окисления в KMnO4              
    // 5) solution = {KMnO4:{K:1, Mn:7}, SO2:{S:4}} - ответом являются соответствующие степени окисления 
    // (правильные значения степени окисления и коэффициента рассчитывается автоматичнски)
    function setSolution(solution) {
      if (!solution) return;
      console.groupCollapsed('Setting solution ', solution);
      //установку нового значения решения начинаем с очистки старого, если оно есть
      this._SOLUTION = [];
      //если решение не требуется, закругляемся
      if (solution == "none") {
        //если editable не задан, по умолчанию, редактируеются все степени окисления по клику
        if (!editable) editable = "coeffsAll";
        console.groupEnd('Setting solution ', solution);
        return;  
      }
      //////////////////////////////////////////
      // Класс для объекта реестра заданных решений.  //
      //////////////////////////////////////////
      //класс для элемента реестра решений, делаем его для удобной проверки все ли решено:
      //геттер в этом объекте для свойства current по умному выдает либо коэффициент либо степень окисления в зависимости
      //от типа элемента в свойстве elem.
      class SOLUTION_entry {
        constructor(elem, correct) {
          this.elem = elem;
          this.correct = correct;
          //устанавливаем геттер на свойство current
          Object.defineProperty(this, 'current', {
            get: function() {
              return Reaction.getValueByDOM(elem);
            },
            enumerable: true,
            configurable: true
          });
        }
      }
      //добавляет запись в реестр решений
      let addSolutionEntry = (function (elem, solution) {
        console.groupCollapsed('Adding entry to SOLUTION', elem, solution);
        const newEntry = new SOLUTION_entry(elem, solution);
        this._SOLUTION.push(newEntry);
        // console.log('current SOLUTION:', JSON.parse(JSON.stringify(this._SOLUTION)));
        // console.groupEnd('Adding entry to SOLUTION', elem, solution);
      }).bind(this);
      //проверяем различные варианты solution
      if (solution == "coeffsAll") {
        console.groupCollapsed('setting solution equal to coeffsAll');
        //находим коэффициенты, если не можем найти - ошибка
        if (!reactionTree.findCoeffs()) throw new Error('cant solve reaction ', this);
        //для каждого вещества в RT создаем запись в реестре с рассчитанным коэффициентом
        reactionTree.compoundObjsArr.forEach( compoundObj => {
          const compoundDOM = compoundObj.elem;
          const solution = compoundObj.foundCoefficient;
          addSolutionEntry(compoundDOM, solution);
        });
        //раз решение - расставить все коэффициенты, то коэффициенты должны расставляться
        //если нам не задано, что все коэффициенты редактируемы всегда принудительно далаем так, что они
        //редактируемы по клику всегда
        reactionTree.compoundObjsArr.forEach( compoundObj  => {
          const formula = compoundObj.formula;
          addEditableCoef(formula);
        });
        console.groupEnd('setting solution equal to coeffsAll');
        console.groupEnd('Setting solution ', solution);
        return;  
      }
      //установка "все степени окисления должны быть правильными"
      if (solution == "oxiStatesAll") {
        console.groupCollapsed('setting solution equal to oxiStatesAll');
        reactionTree.findOxiStates();
        reactionTree.elementObjsArr.forEach(elementObj => {
          const elementDOM = elementObj.elem;
          const solution = elementObj.foundOxiState;
          addSolutionEntry(elementDOM, solution);
        });
        //раз решение - расставить все коэффициенты, то коэффициенты должны расставляться
        editable = 'oxiStatesAll';
        console.groupEnd('setting solution equal to oxiStatesAll');
        console.groupEnd('Setting solution ', solution);
        return;
      }
      //кроме перечисленных выше текстовых значений solution иметь не может, поэтому
      //если solution не объект и ничто из перечисленнего выше - сворачиваемся 
      if (!(solution instanceof Object)) return;

      console.groupCollapsed('setting solution equal to an object:', solution);
      //для каждого ключа решения в объекте solution настраиваем решение
      [...solution].forEach( formula => {
        const formulaKey = solution[formula];
        //если такого вещества нету в уравнении - пропускаем
        const compoundDOM = reactionTree.formulaToCompDOM(formula);
        if (!compoundDOM) return;
        //если после формулы идет 'coeff' - значит для этой формулы нужно поставить правильный коэффициент (случай 2)
        if (formulaKey == 'coeff' || formulaKey == 'coeffAlways') {
          console.groupCollapsed('setting option coeff', 'for a compound', formula);
          //если до сих пор реакция не решена - решаем
          if (!reactionTree.foundCoeffs) reactionTree.findCoeffs();
          const compoundObj = reactionTree.formulaToCompObj(formula);
          const solution = compoundObj.foundCoefficient;
          //делаем соответствующую запись в реестре
          addSolutionEntry(compoundDOM, solution);
          //не забываем сделать этот коэффициент редактируемым
          if (formulaKey == 'coeff') addEditableCoef(formula);
          else addEditableCoef(formula, 'always');
          console.groupEnd('setting option coeff', 'for a compound', formula);
          return;
        } 
        //если после формулы идет 'oxiStates' - назначаем правильным решением правильные степени окисления для
        //всех элементов данного вещества (случай 3)
        if (formulaKey == 'oxiStates') {
          console.groupCollapsed('setting option oxiStates', 'for a compound', formula);
          //если до сих пор реакция не решена - решаем
          if (!reactionTree.oxiStatesFound) reactionTree.findOxiStates();
          //после того, как нашли степени окисления, назначаем их правильными решениями
          reactionTree.elementObjsArr.forEach( elementObj => {
            const [elementDOM, compoundObj, symbol, solution] = [elementObj.elem, elementObj.compoundObj, elementObj.symbol, elementObj.foundOxiState];
            //делаем соответствующую запись в реестре
            addSolutionEntry(elementDOM, solution);
            //добавляем в editable опцию редактирования этой степени окисления
          }, formula);
          //если в editable стоит запись 'oxiStatesAll' то не трогаем editable
          if (editable == 'oxiStatesAll') return;
          //если editable сейчас является массивом (редактирование коэффициентов), перезаписываем в него пустой объект {}
          if (!(editable instanceof Object)) editable = {};
          //добавляем в editable свойство с текущей формулой и сразу записываем туда 'oxiStates'
          editable[formula] = 'oxiStates';
          console.groupEnd('setting option oxiStates', 'for a compound', formula);
          return;
        }
        //если после фомулы стоит число - значит задать его коэффициентом (случай 1)
        if (!isNaN(formulaKey)) {
          console.groupCollapsed('setting option', formulaKey, 'for a compound', formula);
          //делаем соответствующую запись в реестре
          addSolutionEntry(compoundDOM, formulaKey);
          //если editable не подразумевает редактирование сразу всех коэффициентов,
          //добавляем туда опцию редактирования коэффициента перед текущим веществом
          addEditableCoef(formula);
          console.groupEnd('setting option', formulaKey, 'for a compound', formula);
          return;
        } 
        //если после формулы идет массив элементов - то надо сделать редактируемыми все степени окисления для элементов в этом массиве 
        if (formulaKey instanceof Array) {
          console.groupCollapsed('Setting a set of correct oxiStates:', formulaKey, 'in', formula);
          const compoundObj = reactionTree.formulaToCompObj(formula); 
          //если до сих пор реакция не решена - решаем
          if (!reactionTree.oxiStatesFound) reactionTree.findOxiStates();
          //после того, как нашли степени окисления, назначаем их правильными решениями
          formulaKey.forEach(symbol => {
            const elementObj = compoundObj[symbol]; 
            if (!elementObj) return;
            const elementDOM = elementObj.elem; 
            const solution = elementObj.foundOxiState;
            //делаем соответствующую запись в реестре
            addSolutionEntry(elementDOM, solution);
            //добавляем в editable опцию редактирования этой степени окисления
            addEditableOxiState(formula, symbol);
          });
          console.groupEnd('Setting a set of correct oxiStates:', formulaKey, 'in', formula);
          return;
        } 
        //если после формулы идет объект (именно объект, а не массив) - то в нем степени окисления для элементов (случай 5). Задаем.
        if (formulaKey instanceof Object) {
          console.groupCollapsed('Setting a set of correct oxiStates:', JSON.parse(JSON.stringify(formulaKey)), 'in', formula);
          [...formulaKey].forEach( symbol => {
            const elementDOM = reactionTree.symbolToElemDOM(symbol, formula);
            if (!elementDOM) return;
            const solution = formulaKey[symbol];
            //делаем соответствующую запись в реестре
            addSolutionEntry(elementDOM, solution);
            //добавляем в editable опцию редактирования этой степени окисления
            addEditableOxiState(formula, symbol);
            return;
          });
          console.groupEnd('Setting a set of correct oxiStates:', JSON.parse(JSON.stringify(formulaKey)), 'in', formula);
        }
      });
      console.groupEnd('setting solution equal to an object:', solution);
      console.groupEnd('Setting solution ', solution);
    } 
    //задает редактируемость 
    //общий прицип работы setEditable:
    //1. чтобы сделать с.о. или коэффициент редактируемым по клику - достаточно просто
    //добавить его DOM элемент в this._editableOnClick - кликабельность обеспечивается
    //обработчиком на клик по текущему DIV.reaction, который проверяет, есть ли target
    //в this._editableOnClick, и если есть - показывает инпут
    //2. чтобы сделать коэффициент редактируемым всегда - для него создается инпут и 
    //объект инпута добавляется в this._alwaysEditable - реестр всегда редактируемых 
    //инпутов
    //Общие положения:
    //1. Степени окисления и коэффициенты не могут редактироваться одновременно: или 
    //то, или то
    //2. Степени окисления редактируются только по клику. Это сделано из соображений 
    //эстетики - когда степень окисления редактируема всегда, это выглядит не очень.
    //ВОЗМОЖНЫЕ ФОРМАТЫ:
    //'coeffsAll' - все коэффициенты редактируемы по клику
    //'coeffsAllAlways' - все коэффициенты редактируемы всегда
    //'oxiStatesAll' - все степени окисления редактируемы по клику
    //{formula1:'always'} - у вещества formula1 коэффициенты редактируются всегда
    //{formula1:'onclick'} - у вещества formula1 коэффициенты редактируются по клику
    //{formula1:['elem1', 'elem2', ..]} - у вещества formula1 у элементов elem1, elem2,... степени окисления редактируемы по клику
    //{formula1:'oxiStates'} - у вещества formula1 у всех элементов степени окисления редактируемы по клику
    function setEditable(editable) {
      if (!editable) return;
      //если раньше уже были настройки редактируемых элементов - стираем их
      //если нет - создаем
      if (this._editableOnClick) this._editableOnClick.forEach( elem => reactionInputsManager.removeClickableElem(elem)); 
      // если перед установкой уже есть какие-либо перманентные инпуты - скрываем их
      if (this._alwaysEditable) this._alwaysEditable.forEach(input => input.hide()); 
      this._editableOnClick = [];
      this._alwaysEditable = [];
      const editableOnClick = this._editableOnClick;
      //на всякий случай, если уже стоит, удаляем слушатель кликов по элементу,
      //а также удаляем слушатель за попытками пользователя
      this.elem.removeEventListener('click', this.__reactOnClick);
      this.elem.removeEventListener('trial', this.__onTrial);
      //запретить редактирование всех элементов
      if (editable == "none") {
        return;  
      }
      console.groupCollapsed('SettingEditable');
      this.elem.style.cursor = 'pointer';
      //coeffsAll (по умолч) - все коэф редактируются при клике на вещество
      if (editable == "coeffsAll") {
        console.groupCollapsed('Setting coeffsAll');
        this._editableOnClick = [...this.elem.querySelectorAll('.compound')];
        
        console.log(this._editableOnClick);  
        console.groupEnd('Setting coeffsAll');
        console.groupEnd('SettingEditable');
        return;
      }
      //coeffsAllAlways - все коэф. всегда доступны для редактирования, без клика
      if (editable == "coeffsAllAlways") {
        console.groupCollapsed('Setting coeffsAllAlways');
        this.elem.querySelectorAll('.compound').forEach( compound => setAlwaysEditableCoef.bind(this)(compound));
        
        console.log(this._alwaysEditable);
        console.groupEnd('Setting coeffsAllAlways');
        console.groupEnd('SettingEditable');
        return;
      }
      //oxiStatesAll - все степени окисления доступны для редактирования по клику 
      if (editable == "oxiStatesAll") {
        console.groupCollapsed('Setting oxiStatesAll');
        this._editableOnClick = [...this.elem.querySelectorAll('.elem')];
        console.log(this._editableOnClick); 
        console.groupEnd('Setting oxiStatesAll');
        console.groupEnd('SettingEditable');
        return;
      }
      //кроме перечисленных выше текстовых значений editable иметь не может, поэтому
      //если editable не объект и ничто из перечисленнего выше - сворачиваемся, значит неправильно задан editable 
      if (!(editable instanceof Object)) {
        console.groupEnd('SettingEditable');
        return;
      }
      //если editable - Object, то все ключи в нем - формулы
      [...editable].forEach( formula => {
        const formulaKey = editable[formula];
        //если такого вещества нету в уравнении - пропускаем
        const compoundDOM = reactionTree.formulaToCompDOM(formula);
        if (!compoundDOM) return;

        //если у формулы вещества ключ 'onclick' - сделать вещество редактируемым по клику
        if (formulaKey == 'onclick') {
          console.groupCollapsed('Setting coeff editable on click for compound ', formula);

          this._editableOnClick.push(compoundDOM);

          console.groupEnd('Setting coeff editable on click for compound ', formula);
        }

        //если у формулы вещества ключ 'onclick' - сделать вещество редактируемым всегда
        if (formulaKey == 'always') {
          console.groupCollapsed('Setting coeff editable always for compound ', formula);

          setAlwaysEditableCoef.bind(this)(compoundDOM);

          console.groupCollapsed('Setting coeff editable always for compound ', formula);
        }

        //если напротив формулы вещества стоит ключ oxiStates
        if (formulaKey == 'oxiStates') {
          console.groupCollapsed('Setting editable all oxistates for compound ', formula);

          const compoundObj = reactionTree.formulaToCompObj(formula);
          const elements = [...compoundObj];
          elements.forEach( elemInFormula => {
            const elementObj = compoundObj[elemInFormula];
            if (!elementObj) return;
            const elementDOM = elementObj.elem;
            this._editableOnClick.push(elementDOM);
          });

          console.groupEnd('Setting editable all oxistates for compound ', formula);
        }
        //оставшийся вариант подразумевает, что в ключе у формулы массив элементов, для которых надо задать 
        //редактируемую степень окисления 
        if (formulaKey instanceof Array) {
          console.groupCollapsed('Setting editable oxistates for elements ', formulaKey,'in compound ', formula);
          formulaKey.forEach(symbol => {
            const elementDOM = reactionTree.symbolToElemDOM(symbol, formula); 
            if (!elementDOM) return;
            this._editableOnClick.push(elementDOM);
          });
        }
      });
      console.groupEnd('SettingEditable');
    }
    //Вспомогательные функции
    //добавляет в editable запись о том, что коэффициент перед formula надо сделать редактируемым 
    //используется в setSolution 
    function addEditableCoef(formula, condition) {
      console.groupCollapsed('Setting editable coef for a compound', formula);
      //если едитабл уже подразумевает редактирование всех коэффициентов - ничего менять не надо
      if (editable == 'coeffsAll' || editable == 'coeffsAllAlways') {
        console.groupEnd('Setting editable coef for a compound', formula);
        return;
      }
      //если editable не является объектом, стираем его и делаем новый editable = {} с чистого листа
      if (!(editable instanceof Object)) editable = {};
      //если в editable еще нет формулы текущего вещества - включить ее туда
      //по умолчанию, если надо найти коэффициент, то он редактируется по клику, если не сказано обратного в editable
      if (!editable[formula]) { 
          editable[formula] = (!condition || condition == 'onclick') ? 'onclick' : 'always';
      } 
      console.log('new editable ', JSON.parse(JSON.stringify(editable)));
      console.groupEnd('Setting editable coef for a compound', formula);
    }
    //добавляет в editable запись о том, что степень окисления элемента symbol в formula надо сделать редактируемым 
    //используется в setSolution 
    function addEditableOxiState(formula, symbol) {
      console.groupCollapsed('Setting editable oxi state for a ', symbol, 'in formula', formula);
      //если и так подразумевается редактирование всех степеней окисления - ничего менять не надо
      if (editable == 'oxiStatesAll') {
        console.groupEnd('Setting editable oxi state for a ', symbol, 'in formula', formula);
        return;
      }
      //если editable сейчас является объектом, перезаписываем в него пустой объект {}
      if (!(editable instanceof Object)) editable = {};
      // если в editable еще нет записи с текущей формулой - добавляем и сразу записываем туда текущий элемент
      if (!editable[formula]) {
        editable[formula] = [];
        editable[formula].push(symbol);
        console.groupEnd('Setting editable oxi state for a ', symbol, 'in formula', formula);
        return;
      }
      //если в editable уже есть запись с этой формулой и она включает в себя редактирование всех степеней окисления - 
      //ничего менять не надо
      if (editable[formula] == 'oxiStates') {
        console.groupEnd('Setting editable oxi state for a ', symbol, 'in formula', formula);
        return;
      }
      //если editable - объект с массивами элементов в объекте editable нету записи для текущего вещества, или есть но не все степени окисления
      //то записываем туда текущий элемент
      if (!editable[formula].includes(symbol)) editable[formula].push(symbol);
      console.groupEnd('Setting editable oxi state for a ', symbol, 'in formula', formula);
    } 
    //задает для вещества (compoundDOM) всегда редактируемым коэффициент
    function setAlwaysEditableCoef(compoundDOM) {
      console.groupCollapsed('Setting Always editable Coef for coumpound ', compoundDOM);
      /////////////////////////////////////
      //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! //
      /////////////////////////////////////
      const input = new CoefInput({elem:compoundDOM, showCondition: 'always'});
      input.showInput();
      this._alwaysEditable.push(input);

      console.groupEnd('Setting Always editable Coef for coumpound ', compoundDOM);
    } 
  }
  onTrial(e) {
    console.log('Trial detected');
    const changedDOM = e.target;
    //после внесения изменений необходимо обновить reactionTree
    //если изменяли вещество - обновляем,  если надо, коэффициент
    //если изменяли элемент - обновляем,  если надо, степень окисления
    const changedObj = this.reactionTree.refreshChemical(changedDOM);
    console.log(this.reactionTree, changedObj);

    this.sendData(changedObj);

    //проверка на правильное решение. осуществляется только если решение существует
    super.onTrial()
  }
  sendData(changedObj) {
    const reactionTree = this.reactionTree;
    const sendData = new CustomEvent('sendData', {
      bubbles: true,
      detail: {reactionTree, changedObj}
    });
    this.elem.dispatchEvent(sendData);
  }
  //действия по выполнению задания
  onComplete() {
    this.sendCompleteEvent();
    this.set({editable:'none', solution:'none'});
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Статические методы, полезные при работе с DOM формата Reaction.                                                      //
  // // формат подразумевает:                                                                                             //
  // 1) реакция или формула в родителе с классом 'reaction'                                                               //
  // 2) все вещества находятся в DIV.compound                                                                             //
  // 3) коэффициент вещества находится либо в DIV.coefficient (если != 1) - первом дочернем элементе DIV.compound,        //
  //  либо в '.coefInput input', если происходит редактирование. Если коэффициент равен 1 и не происходит редактирование, //
  //  DIV.coefficient отсутствует                                                                                         //
  // 4) все элементы находятся в DIV.elem                                                                                 //
  // 5) все степени окисления находятся 'sup'                                                                             //
  // 6) все индексы находятся в 'sub'                                                                                     //
  // 7) круглые и квадратные скобки находятся в текстовых узлах между DIV.elem, внутри DIV.compound                       //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //возвращает формулу по DOM-элементу химического элемента или вещества
  static getFormulaByDOM(chemicalDOM) {
    //если chemicalDOM - DOM для элемента, то у него есть класс elem
    //для элементов надо вернуть просто сивол элемента, без индекса
    if (chemicalDOM.classList.contains('elem')) {
      return chemicalDOM.firstChild.textContent;
    }
    //если chemicalDOM - DOM для вещества, то у него нету класса elem
    //для веществ надо вернуть формулу со всеми скобками, символами элементов и индексами 
    return [...chemicalDOM.childNodes].reduce((sum, currentNode, i, arr) => {
      if (currentNode.nodeType == 1 && (currentNode.matches(".coefficient") || currentNode.matches("sup"))) return sum;
      if (currentNode.nodeType == 1 && currentNode.matches(".elem")) {
        const sub = currentNode.querySelector('sub');
        const index = sub ? sub.textContent : "";
        return sum + currentNode.firstChild.textContent + index; 
      }
      return sum + currentNode.textContent;
    }, "");
  }
  //если chemicalDOM - DOM вещества, то возвращает текущее значение коэффициента,
  //если chemicalDOM - DOM элемента, то возвращает текущее значение степени окисления
  static getValueByDOM(chemicalDOM) {
    if (chemicalDOM.classList.contains('compound')) return Reaction.getCoefVal(chemicalDOM);
    if (chemicalDOM.classList.contains('elem')) return Reaction.getOxiStateVal(chemicalDOM);
  }
  //возвращает коэффициент по DOM-элементу элемента или вещества
  static getCoefVal(chemicalDOM) {
    const coeffElem = Reaction.getCoefDOM(chemicalDOM);
    return  (coeffElem && (coeffElem.value || coeffElem.textContent)) || 1;
  }
  //Здесь и далее - во многих поисковых методах в конце стоит || undefined. Это сделано для того, чтобы в случае если 
  //искомый элемент не найден возвращалось undefined а не null. А это в свою очередь нужно для того, чтобы работали
  //параметры по умолчанию при деструктурировании
  static getCoefDOM(chemicalDOM) {
    const compoundDOM = chemicalDOM.closest(".compound");
    if (!compoundDOM) return;
    return compoundDOM.querySelector('.coefficient') || compoundDOM.querySelector('.coefInput input') || undefined;
  }
  //Отображает единичный коэффициент у compoundDOM в котором находится chemicalDOM. Возвращает DOM коэффициента   
  static showExplicitCoef(chemicalDOM) {
    let coefDOM = Reaction.getCoefDOM(chemicalDOM);
    if (coefDOM) return coefDOM;
    
    const compoundDOM = chemicalDOM.closest('.compound');
    if (!compoundDOM) return;

    coefDOM = document.createElement('div');
    coefDOM.textContent = 1;
    coefDOM.className = 'coefficient'; 
    compoundDOM.prepend(coefDOM);
    return coefDOM; 
  }
  //возвращает нндекс по DOM-элементу элемента или его части (sup/sub)    
  static getIndexVal(chemicalDOM) {
    const indexDOM = Reaction.getIndexDOM(chemicalDOM);
    return indexDOM && indexDOM.textContent || 1;
  }   
  static getIndexDOM(chemicalDOM) {
    const elementDOM = chemicalDOM.closest('.elem');
    if (!elementDOM) return;
    return elementDOM.querySelector('sub') || undefined;
  }
  //Отображает единичный индекс у compoundDOM в котором находится chemicalDOM. Возвращает DOM индекса
  static showExplicitIndex(chemicalDOM) {
    let indexDOM = Reaction.getIndexDOM(chemicalDOM);
    if (indexDOM) return indexDOM;

    const elementDOM = chemicalDOM.closest('.elem');
    if (!elementDOM) return;

    indexDOM = document.createElement('sub');
    indexDOM.textContent = 1;
    elementDOM.append(indexDOM);
    return indexDOM;
  }
  //возвращает степень окисления по DOM-элементу элемента или его части (sup/sub)
  static getOxiStateVal(chemicalDOM) {
    const elementDOM = chemicalDOM.closest('.elem');
    if (!elementDOM) return;

    const oxiStateDOM = Reaction.getOxiStateDOM(chemicalDOM);
    return (oxiStateDOM && (oxiStateDOM.value || oxiStateDOM.textContent)) || undefined;
  }
  static getOxiStateDOM(chemicalDOM) {
    const elementDOM = chemicalDOM.closest('.elem');
    if (!elementDOM) return;

    return elementDOM.querySelector('.oxiStateInput input') || elementDOM.querySelector('sup');
  }
  //возвращает изменение числа электронов в реакции для elementDOM
  static getDeltaElectronsVal(chemicalDOM) {
    const electronsDOM = Reaction.getDeltaElectronsDOM(chemicalDOM);
    if (electronsDOM) return parseInt(electronsDOM.textContent);
  }
  //возвращает DOM-элемент с изменением числа электронов для compoundDOM включающим в себя chemicalDOM
  //возвращает первый найденный DOM с электронами, соответственно работает как надо только для молекул где только 1 вид атомов участвует в ОВР
  static getDeltaElectronsDOM(chemicalDOM) {
    const compoundDOM = chemicalDOM.closest('.compound');
    if (!compoundDOM) return;
    return compoundDOM.querySelector('.electrons') || undefined;
  }
  // возвращает true, если элемент находится внутри скобок, и false, если не в скобках
  // принцип действия такой: считаем все открывающиеся скобки перед данным элементом, и все закрывающиеся. Находим разность. 
  // Если разность != 0 => элемент находится в скобках. bracketType = "round" / "square" - круглые или квадратные скобки
  static inBrackets(elementDOM, bracketType="round") {
    const [openBracket, closeBracket] = (bracketType == "round") ? ["(", ")"] : ["[", "]"];
    return getPreviousSiblings(elementDOM).reduce( (sum, currentNode) => {
      const text = currentNode.textContent;
      if (text.includes(openBracket)) return sum + 1;
      if (text.includes(closeBracket)) return sum - 1;
      return sum;
    }, 0);
  }
  //Находит первую закрывающую скобку после элемента, и возвращает значение ближайшего <sub> после нее, если он есть
  static getBracketIndexVal(elementDOM, bracketType="round") {
    const sub = Reaction.getCloseBracketIndexDOM(elementDOM, bracketType);
    return sub && sub.textContent || 1;
  }
  //возвращает <sub> после закрывающей скобки bracketType для elementDOM, или undefined 
  static getCloseBracketIndexDOM(elementDOM, bracketType="round") {
    //находим ближайший к elementDOM текстовый узел, содержащий закрывающую скобку типа bracketType 
    const closeBracket = Reaction.getCloseBracketNode(elementDOM, bracketType);
    //если закрывающей скобки нету - отмена миссии
    if (!closeBracket) return;
    
    let sub;
    let nextNode = closeBracket.nextSibling;
    //перебираем всех последующих сиблингов закрывающей скобки в поисках <sub> - индексы всегда записываются в sub, 
    //согласно формату записи реакций класса Reaction
    //если нам попадается следующий элемент - DIV.evelem - прекращаем поиски, т.к. <sub> для скобки должен быть перед
    //следующим элементом.  
    while(nextNode) {
      if (nextNode.nodeType == 1 && nextNode.matches('sub')) {
        sub = nextNode;
        break;
      }
      if (nextNode.nodeType == 1 && nextNode.matches('.elem')) {
        break;
      }
      nextNode = nextNode.nextSibling;
    }
    //если не нашли <sub> - возвращаем индекс по умолчанию, 1, т.к. индексы не пишутся только если равны 1
    return sub || undefined
  }
  static showExplicitCloseBracketIndex(elementDOM, bracketType='round') {
    if (!Reaction.inBrackets(elementDOM, bracketType)) return;

    let closeBracketIndexDOM = Reaction.getCloseBracketIndexDOM(elementDOM, bracketType);
    if (closeBracketIndexDOM) return closeBracketIndexDOM;

    const closeBracketNode = Reaction.getCloseBracketNode(elementDOM, bracketType);
    closeBracketIndexDOM = document.createElement('sub');
    closeBracketIndexDOM.textContent = 1;
    closeBracketNode.after(closeBracketIndexDOM);
    return closeBracketIndexDOM;
  }
  //возвращает текстовый узел закрывающей скобки типа bracketType для elementDOM
  static getCloseBracketNode(elementDOM, bracketType="round") {
    const elementNextSiblings = getNextSiblings(elementDOM);
    const closeBracket = (bracketType == "round") ?  ")" : "]";
    return elementNextSiblings.find( node => node.textContent.includes(closeBracket));
  }
  static getCompoundChargeVal(compoundDOM) {
    const chargeDOM = Reaction.getCompoundChargeDOM(compoundDOM);
    return chargeDOM && chargeToDigit(chargeDOM.textContent) || 0;
  }
  static getCompoundChargeDOM(compoundDOM) {
    const chargeDOMs = [...compoundDOM.querySelectorAll('sup')].filter( sup => !sup.closest('.elem'));
    if (chargeDOMs[1]) throw new Error('must be one charge at compoundObj', this);
    return chargeDOMs[0] || undefined;
  }
  static showExplicitCharge(compoundDOM) {
    let chargeDOM = Reaction.getCompoundChargeDOM(compoundDOM);
    if (chargeDOM) return chargeDOM;

    chargeDOM = document.createElement('sup');
    chargeDOM.textContent = 0;
    compoundDOM.append(chargeDOM);
    return chargeDOM;
  }
  //убирает не обязательные к отображению элементы реакции из compoundDOM, включающего в себя chemicalDOM 
  //необязательными к отображению являются:
  //  1) индексы и коэффициенты равные 1
  //  2) заряд равный 0
  //  3) (не связано с химическими правилами) все пустые элементы DOM
  static clearUnnecessary(chemicalDOM) {
    const compoundDOM = chemicalDOM.closest('.compound');
    if (!compoundDOM) return;

    [...compoundDOM.querySelectorAll('sub'), compoundDOM.querySelector('.coefficient'), compoundDOM.querySelector('.compound > sup')].forEach(elem => {
      if (!elem) return; 
      const txt = elem.textContent;
      if (txt == 1 || txt == 0 || txt == '') elem.remove();
    });
  }
  //возвращает объект с всеми DOM элементами, ассоциированными с элементом:
  // coefDOM -  DOM коэффициента (если есть)
  // indexDOM
  // roundBracketIndexDOM
  // squareBracketIndexDOM
  // если что то из перечисленного отсутствует - знаечние ключа будет undefined
  static getElementRealtedDOMs(elementDOM) {
    const coefDOM = Reaction.getCoefDOM(elementDOM);
    const indexDOM = Reaction.getIndexDOM(elementDOM);
    const roundBracketIndexDOM = Reaction.getCloseBracketIndexDOM(elementDOM, 'round');
    const squareBracketIndexDOM = Reaction.getCloseBracketIndexDOM(elementDOM, 'square');
    const electronsDOM = Reaction.getDeltaElectronsDOM(elementDOM);
    console.log(coefDOM, indexDOM, roundBracketIndexDOM, squareBracketIndexDOM);
    return {coefDOM: coefDOM, indexDOM: indexDOM, roundBracketIndexDOM: roundBracketIndexDOM, squareBracketIndexDOM: squareBracketIndexDOM};
  }
}

