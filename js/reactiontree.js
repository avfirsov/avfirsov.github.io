///////////////////////////
//вспомогательные классы //
///////////////////////////


///////////////////////////////////////
//класс оьъекта химического элемента //
///////////////////////////////////////
//имеет следующие свойства:
//  elementObj.elem (= elementDOM) - DOM-элемент соответствующий химическому элементу
//  elementObj.symbol - сивол химического элемента (string)
//  elementObj.compoundObj: объект вещества класса CompoundObj, в котором находится данный химический элемент
//  elementObj.oxiState: число. Степень окисления. Берется из DOM химического элемента. (может отсутствовать, если не указано) 
//  elementObj.index: число. Химический индекс элемента. Берется из DOM, если в DOM не указан - равен 1
//  elementObj.bracketIndex: число. Равно 1, или химическому индексу круглых скобок, если элемент в них. 
//  elementObj.squareBracketIndex: Равно 1, или химическому индексу квадратных скобок, если элемент в них.
//  elementObj.deltaElectrons: число. По смыслу - сколько электронов атом отдает или принимает в реакции.
//  Берется из DOM химического элемента. (может отсутствовать, если не указано) 
//имеет метод:
//  getTotal() - возвращает полное количество атомов данного элемента в compoundObj из elementObj.compoundObj
class ElementObj {
  constructor({compoundObj, symbol, elem, oxiState, index=1, bracketIndex=1, squareBracketIndex=1, deltaElectrons}) {
  	[this.elem, this.symbol, this.compoundObj, this.index, this.bracketIndex, this.squareBracketIndex] = [elem, symbol, compoundObj, index, bracketIndex, squareBracketIndex];
    if (oxiState) this.oxiState = oxiState;
    if (deltaElectrons) this.deltaElectrons = deltaElectrons;
  }
  //возвращает полное количество атомов данного элемента в его compoundObj
  getTotal() {
    return this.index * this.bracketIndex * this.squareBracketIndex;
  }
}

///////////////////////////
//класс объекта вещества //
///////////////////////////
class CompoundObj {
  constructor({elem, coefficient, formula, type}) {
    [this.elem, this.coefficient, this.formula, this.type] = [elem, coefficient, formula, type];
    this.atoms = {};
    this.elementObjsArr = [];
  }
  //публичные методы для удобства работы с объектом вещества
  //добавляет элемент к веществу
  //технически, создает новый экземпляр класса ElementObj, ссылающийся на данный compoundObj
  //элемент и его свойства доступны 2 путями:
  //1) CompoundObj[symbol] - как свойство CompoundObj, не перечисляемое
  //2) CompoundObj.atoms[symbol] - как свойство объекта свойства atoms объекта CompoundObj - перечисляемое, 
  //такой синтаксис используется в перебирающих методах
  addElement({ symbol, elem, oxiState, index, bracketIndex, squareBracketIndex, deltaElectrons}) {
    if (!symbol || !elem) return false;
    const elementObj = this.atoms[symbol] = new ElementObj({compoundObj: this, symbol, elem, oxiState, index, bracketIndex, squareBracketIndex, deltaElectrons});
    //делаем доступным элемент через CompoundObj[symbol], но чтобы не перечисляемым было
    //и делаем объект элемента не перезаписываемым
    Object.defineProperty(this, symbol, {
      get: function() {
        return this.atoms[symbol];
      },
      enumerable: false
    });
    this.elementObjsArr.push(elementObj);
    return elementObj;
  }
  //подсчитывает сколько всего атомов symbol в веществе compoundObj. Если элемент в веществе отсутствует,
  //возвращает 0, иначе - возвращает число, сколько атомов данного элемента в веществе. 
  //Если параметр noSign не задан, или равен false, то возвращает положительное, если compoundObj - реагент, иначе - отрицательное число.
  //Если noSign = true, возвращаемое число будет всегда положительным, независимо от типа вещества 
  getQuantity(symbol, noSign) {
  	if (symbol == "e-") {
  		return this.getDeltaElectrons();
  	}
    const elementObj = this.atoms[symbol];
    if (!elementObj) return 0;
    let total = elementObj.getTotal() * this.coefficient;
    if (noSign) return total; 
    return  total * (this.type == "reactant" ? 1 : -1);
  }
  //находит и расставляет степени окисления в конкретном веществе
  findOxiStates() {
    const formula = this.formula;
    const self = this;
    console.log('Getting OxiStates for ', formula, this);
    //если вещество - простое, т.е. состоит из 1 элемента, то степень окисления - 1.
    if (ifComplete()) return true;
    console.log('Setting constant oxiState', formula, this);
    //если в веществе содержится один из следующих элементов - для него берем степень окисления из списка. Это - все элементы у которых степень окисления всегда постоянная
    new Map ([['Li', 1], ['K', 1], ['Na', 1], ['Ba', 2], ['Ca', 2], ['Mg', 2], ['Sr', 2], ['Al', 3], ['Zn', 2], ['F',-1]]).forEach( (oxiState, symbol) => {
      const elementObj = this[symbol]; 
      if (elementObj) { 
        console.log('Setting oxiState of ', symbol, ' equal to ', oxiState);
        elementObj.foundOxiState = oxiState;
      }
    });
    //проверяем, не звершили ли мы подбор.
    //на этом этапе будут готовы гидриды, фториды кислорода, пероксиды, оксиды, надпероксиды и прочие бинарные соединения металлов с постоянной степенью окисления
    if (ifComplete()) return true;
    //если мы дошли до сюда, значит у нас точно не гидрид и у водорода степень окисления +1
    console.log('Setting oxiState H', formula, this);
    const H = this['H'];
    if (H) H.foundOxiState = 1;
    if (ifComplete()) return true;
    //если мы дошли до сюда, то у нас точно не перекись, точно не фторид кислорода, не оксид, а что-то другое. Кислород в этом случае 100% имеет со -2 
    console.log('Setting oxiState O', formula, this);
    const O = this['O'];
    if (O) O.foundOxiState = -2;
    if (ifComplete()) return true;
    //если мы дошли до сюда, то скорее всего у нас соединение металла с переменной степенью окисления и каким то неметаллом кроме H и O
    //проверим, не входит ли в нашу формулу какой из кислотных остатков, а если входит - назначим неметаллу степень окисления из остатка
    console.log('Setting oxiState for a acidic residue or NH4+', formula, this);
    new Map ([['NH4', ['N', -3]],
      ['NH3', ['N', -3]],
      ['SO4',['S', 6]],
      ['SO3',['S',4]],
      ['S', ['S', -2]],
      ['CO3', ['C', 4]],
      ['NO3', ['N', 5]],
      ['NO2', ['N', 3]],
      ['PO4', ['P', 5]],
      ['SiO3', ['Si', 4]],
      ['ClO4', ['Cl', 7]],
      ['ClO3', ['Cl', 5]],
      ['ClO2', ['Cl', 3]],
      ['ClO', ['Cl', 1]],
      ['Cl', ['Cl', -1]],
      ['BrO4', ['Br', 7]],
      ['BrO3', ['Br', 5]],
      ['BrO2', ['Br', 3]],
      ['BrO', ['Br', 1]],
      ['Br', ['Br', -1]],
      ['IO4', ['I', 7]],
      ['IO3', ['I', 5]],
      ['IO2', ['I', 3]],
      ['IO', ['I', 1]],
      ['I', ['I', -1]]
      ]).forEach((set, residue) => {
        if (!formula.includes(residue)) return;

        const symbol = set[0];
        const elementObj = this[symbol]; 
        const foundOxiStateValue = set[1];
        console.log('Setting oxiState of ', elementObj, ' equal to ', set[1]);
        //если у этого элемента уже есть степень окисления - не переписываем
        if (elementObj.foundOxiState) return; 
        elementObj.foundOxiState = foundOxiStateValue;
      });
    if (ifComplete()) return true;
    //к этому моменту, все степени окисления должны быть расставлены, а если нет - значит произошла ошибка
    throw new Error ('cant find Oxi states');
    ////////////////////////////
    //Вспомогательные функции //
    ////////////////////////////
    //функция, которая проверяет, остались ли ненайденные степени окисления в веществе с формулой formula. Если осталась
    //ровно 1 ненайденная степень окисления - то доставляет ей степень окисления по правлу чтобы
    //сумма всех с.о. равнялась заряду степеней окисления. возвращает true, если все степени доставлены, и false - 
    //если степеней остается больше, чем 1.
    function ifComplete() {
      const left = elemsLeft();
      if (left.length == 0) return true;
      if (left.length == 1) {
        console.log('Computing oxiStates for single rest element', left);
        const elementObj = left[0];
        //здесь self - это compoundObj
        const charge = Reaction.getCompoundChargeVal(self.elem);
        const oxiState = (charge - sumOxiStates()) / elementObj.getTotal()
        console.log('Setting oxiStates for single rest element', left, 'equal to', oxiState);
        if (isNaN(oxiState)) throw new Error ('cant find oxiState'); 
        elementObj.foundOxiState = oxiState;
        return true;
      }
      if (left.length > 1) return false;
    }
    //возвращает массив из объектов элементов, для которых еще не найдена степень 
    //окисления в веществе this
    function elemsLeft() {
      console.log(this);
      const elemsLeft = [];
      self.elementObjsArr.forEach(elementObj => {
        if (!elementObj.foundOxiState) elemsLeft.push(elementObj);
      });
      console.log('Collected elemsLeft here:', elemsLeft);
      return elemsLeft;
    }
    //возвращает сумму всех найденных степеней окисления (с учетом индекса элемента и индексов скобок) 
    //для вещества this. Если ни одна степень окисления не найдена, вернет 0.
    function sumOxiStates() {
      let sum = 0;
      console.log('starting to sum oxiStates in formula'); 
      self.elementObjsArr.forEach(elementObj => {
        const oxiState = elementObj.foundOxiState;
        const multiplier = elementObj.getTotal();
        if (oxiState) sum += oxiState * multiplier;  
      });
      console.log('got sum of oxiStates in formula', sum);
      return sum;
    }
  }
  //возвращает полное количество переносимых электронов от или к молекуле, с учетом коэффициента
  getDeltaElectrons() {
  	let sum = 0;
  	this.elementObjsArr.forEach( elementObj => {
  		const deltaE = elementObj.deltaElectrons; 
  		if (deltaE) sum += deltaE * elementObj.getTotal(); 
  	});
  	return sum * this.coefficient;
  }  
}


/////////////////////////////////////////////////////////////////////////////
//Класс для объекта реакции - в нем хранится вся информация о реакции      //
//Класс Reaction - это объект для удобной визуализации химических реакций. //
//А это своего рода реестр реакции, цифровое отображение химической сути   //
/////////////////////////////////////////////////////////////////////////////
class ReactionTree {
  constructor(reactionObj){
    const elem = reactionObj.elem;
    this.elem = elem;
    //флаги показывающие, уравнивали реакцию или нет, и находили в ней степени окисления, или нет
    this.foundCoeffs = false;
    this.foundOxiStates = false;
    //если реакция до сих пор не размечена - размечаем ее
    if (elem.children.length == 0) reactionObj.layout(); 
  }
  //достает из DOM реакции всю информацию об индексах, коэффициентах, степенях окисления и записывает ее в объект
  //структура объекта такая:
  //ReactionTree = {
  // reactants: {
  //   [formula]: {
  //     formula: %formula%
  //     coefficient: %coefficient%,
  //     elem: reactantDOM,
  //     atoms: {
  //      [elementSymbol]: {
  //        index: %index%,
  //        elem: DOM для данного элемента,
  //        oxiState: указывается только если есть в веществе,
  //        bracketIndex: индекс за скобками (если вещество в скобках),
  //        squareBracketIndex: индекс за квадратными скобками (если вещество в них)
  //        }
  //      }
  //     }
  //   },
  // products: {ЗАПОЛНЯЕТСЯ ТОЛЬКО ЕСЛИ В РЕАКЦИИ ЕСТЬ ПРОДУКТЫ ПОСЛЕ СТРЕЛКИ}
  //}
  make() {
    const compounds = [...this.elem.querySelectorAll('.compound')];
    this._compounds = compounds;
    //ищем стрелку в уравнении. 
    //наполняем массивы reactants и products и сохраняем их в приватное свойство ReactionTree. Возможно, они нам потом понадобятся
    let firstProduct = compounds.findIndex(compound => compound.previousSibling && compound.previousSibling.textContent.includes(ARROW));
    if (firstProduct == -1) {
      this._reactants = compounds.slice(0);
    } else {
      this._reactants = compounds.slice(0, firstProduct); 
      this._products = compounds.slice(firstProduct); 
    }

    this.compoundObjsArr = [];
    this.elementObjsArr = [];

    //наполняем сам объект. Главные два публичных свойства - reactants и products, содержат всю информацию о реакции
    compounds.forEach(compoundDOM => {
      //определяем с каким веществом работаем: с реагентом или с продуктом и создаем соответст объект, если еще не был создан
      let type = this._reactants.includes(compoundDOM) ? "reactants" : "products";
      if (!this[type]) this[type] = {};
      //получаем формулу текущего вещества в виде строки
      const formula = Reaction.getFormulaByDOM(compoundDOM);
      const coefficient = Reaction.getCoefVal(compoundDOM);
      //наполняем объект вещества, если вещество с такой formula еще не присутствует в ReactionTree
      if (this[type][formula]) return;  
      const compoundObj = this[type][formula] = new CompoundObj({elem:compoundDOM, formula, coefficient, type: type.slice(0, -1)});  
      this.compoundObjsArr.push(compoundObj);
      //теперь наполняем сведения об элементах в веществе
      //в объекте atoms внутри compoundObj
      const elements = compoundDOM.querySelectorAll('.elem');
      
      elements.forEach( elementDOM => {
        //получаем символ элемента и создаем объект с таким ключом для наполнения
        const symbol = Reaction.getFormulaByDOM(elementDOM);
        const oxiState = Reaction.getOxiStateVal(elementDOM);
        const index = Reaction.getIndexVal(elementDOM);
        const bracketIndex = Reaction.inBrackets(elementDOM, "round") ? Reaction.getBracketIndexVal(elementDOM, "round") : 1;
        const squareBracketIndex = Reaction.inBrackets(elementDOM, "square") ? Reaction.getBracketIndexVal(elementDOM, "square") : 1;
        const deltaElectrons = Reaction.getDeltaElectronsVal(elementDOM);
        //наполняем объект элемента, если такой элемент еще не присутствует в compoundObj. Например, при наполнении NH4NO3, азот встретится
        //дважды. Пока такие "сложные" формулы обходим стороной. Для них решение надо будет задавать вручную: ни посчитать сколько N в формуле,
        //ни посчитать какая у него степень окисления пока не можем
        if (compoundObj[symbol]) return; 
        const elementObj = compoundObj.addElement({symbol, elem:elementDOM, oxiState, index, bracketIndex, squareBracketIndex, deltaElectrons})
      	this.elementObjsArr.push(elementObj);
      });
    })
  }
    //вспомогательные функции    
  //==========================> до лучших времен
  //приводит в соответствие реестр и DOM реакции
  refresh() {
    this.clear();
    this.make();
  }
  //полностью очищает ReactionTree
  clear() {
    delete this._compounds;
    delete this._products;
    delete this._reactants;
    delete this.reactants;
    delete this.products;
    this.compoundObjsArr.forEach( compoundObj => compoundObj = null);
    this.elementObjsArr.forEach( elementObj => elementObj = null); 
    delete this.compoundObjsArr;
    delete this.elementObjsArr;
  }
  //обновляет значение у объекта в RT с elem == chemicalDOM в соответствии с DOM реакции. Если chemicalDOM - DIV.compound, то обновляет
  //коэффициент. Если chemicalDOM - DIV.elem - то обновляет степень окисления.
  //возвращает chemicalObj, соответствующий обновленному chemicalDOM
  refreshChemical(chemicalDOM) {
    if (chemicalDOM.classList.contains('compound')) return this.refreshCoefficient(chemicalDOM);
    if (chemicalDOM.classList.contains('elem')) return this.refreshOxiState(chemicalDOM);
  }
  //берет текущее значение коэффициента для compoundDOM из RT и сравнивает с текущим в DOM уравнения. 
  //если значения не совпадают - обновляет RT. Учитывает, что коэффициент можент быть в процессе редактирования 
  //возвращает compoundObj, соответствующий обновленному compoundDOM
  refreshCoefficient(compoundDOM) {
    const compoundObj = this.getObjByDOM(compoundDOM);
    if (!compoundObj) return;
    
    const currentVal = compoundObj.coefficient;
    const newVal = Reaction.getCoefVal(compoundDOM);
    //если старое совпадает с новым - ничего не делаем
    if (currentVal == newVal) return;
    //если не совпадает - заменяем старое новым
    compoundObj.coefficient = newVal;
    return compoundObj;
  }
  //берет текущее значение степени окисления для elementDOM из RT и сравнивает с текущим в DOM уравнения. 
  //если значения не совпадают - обновляет RT. Учитывает, что степень окисления можент быть в процессе редактирования
  //возвращает elementObj, соответствующий обновленному elementDOM 
  refreshOxiState(elementDOM) {
    const elementObj = this.getObjByDOM(elementDOM);
    if (!elementObj) return;

    const currentVal = elementObj.oxiState;
    const newVal = Reaction.getOxiStateVal(elementDOM);
    //если старое совпадает с новым - ничего не делаем
    if (currentVal == newVal) return;
    //если не совпадает - заменяем старое новым
    elementObj.oxiState = newVal;
    return elementObj;
  }
  //рассчитывает степени окисления для всех веществ в RT, если они еще не рассчитаны
  findOxiStates() {
    if (this.foundOxiStates) return;
    const self = this;
    this.compoundObjsArr.forEach(compoundObj => compoundObj.findOxiStates());
    this.foundOxiStates = true;
    return;
  }
  //находит правильные коэффициенты у уравнению и возвращает true, 
  //если коэффициенты нашлись успешно, и false - если не получилось
  findCoeffs() {
    console.log('solving', this);
    //искать коэффициенты надо, только если есть продукты
    if (!this.products) return;
    if (this.foundCoeffs) return;
    const matrix = new ReactionMatrix({reactionTree: this});
    try {
      //создаем матрицу по уравнению реакции
      matrix.make();
            
      //диагонализируем матрицу
      matrix.diagonalize();
            
      matrix.diagMatrix = ReactionMatrix.clearZeroStrings(matrix.diagMatrix);
            
      const coeffs = matrix.getCoeffs();
            
      if (!coeffs) throw new Error('cant solve!');
      this.setFoundCoeffs(coeffs);
      return true;
    } 
    catch(e) {
      console.error(e, e.message, 'cant solve!');
      return false;
    }
    this.foundCoeffs = true;
    console.warn('foundCoeffs!', this);
    return true;   
  }
  //устанавливает числа из массива coeffs в свойствах foundCoefficient для веществ в Reaction Tree, в порядке итерации 
  setFoundCoeffs(coeffsArr) {
    this.compoundObjsArr.forEach( (compoundObj, i) => {
      compoundObj.foundCoefficient = coeffsArr[i];
    });
  }
  //собирает все элементы, которые встречаются в реакции, в один сет
  getElementsList() {
    return new Set(this.elementObjsArr.map(elementObj => elementObj.symbol));
  }

  /////////////////////////////////
  // МЕТОДЫ НАВИГАЦИИ ПО РЕАКЦИИ //
  /////////////////////////////////
  //
  //Система навигации:
  // 1) Формула химического вещества - formula (string)
  // 2) Объект химического вещества - compoundObj (instance of CompoundObj)
  // 3) DOM-элемент химического вещества - compoundDOM (classList.contains('compound'))
  // 4) Значок химического элемента - symbol (string)
  // 5) Объект химического элемента - elementObj
  // 6) DOM-элемент химического элемента - elementDOM (classList.contains('elem'))  

  ////////////////////////////////////
  // Навигация по объектам Compound //
  ////////////////////////////////////

  //возвращает элемент compoundDOM, который соответствует указанной формуле formula
  formulaToCompDOM(formula) {
    const compoundObj = this.formulaToCompObj(formula);
    if (compoundObj) return compoundObj.elem;
  }
  //возвращает compoundObj по формуле вещества formula
  formulaToCompObj(formula) {
    const type = this.reactants[formula] ? "reactants" : "products";
    const obj = this[type][formula];
    if (obj) return this[type][formula];
  }
  //возвращает compoundObj, соответствующий compoundDOM
  compDOMToCompObj(compoundDOM) {
    return this.compoundObjsArr.find(compoundObj => compoundObj.elem == compoundDOM);
    // return this.getCompoundObjsArr().find(compoundObj => compoundObj.elem == compoundDOM);
  }
  
  //compoundDOM -> formula:  Reaction.getFormulaByDOM(formula);
  
  //compoundObj -> compoundDOM: compoundObj.elem

  //compoundObj -> formula: compoundObj.formula



  ///////////////////////////////////
  // Навигация по объектам Element //
  ///////////////////////////////////
  
  //////////////
  // полиморф //
  ////////////// 
  //возвращает elementDOM по символу элемента symbol и любому свойству вещества: formula/compoundDOM/compoundObj 
  symbolToElemDOM(symbol, compoundSmth) {
    if (compoundSmth instanceof Node) return this.symbolToElemDOMByCompDOM(symbol, compoundSmth);
    if (compoundSmth instanceof CompoundObj) return compoundObj[symbol].elem; 
    if (typeof compoundSmth == 'string') return this.symbolToElemDOMByFormula(symbol, compoundSmth);
  }
  //возвращает elementDOM по символу элемента symbol и formula
  /////////////////////////////////////
  //Поменять местами аргументы всюду //
  /////////////////////////////////////
  symbolToElemDOMByFormula(symbol, formula) {
    const elementObj = this.symbolToElemObj(symbol, formula);
    if (elementObj) return elementObj.elem; 
  }
  //elementDOM -> elementObj: compoundObj[symbol].elem
  //возвращает elementDOM по символу элемента symbol и compoundDOM
  symbolToElemDOMByCompDOM(symbol, compoundDOM) {
    const elementObj = this.symbolToElemObj(symbol, compoundDOM);
    if (elementObj) return elementObj.elem; 
  }

  //////////////
  // полиморф //
  ////////////// 
  //возвращает elementObj по символу элемента symbol и formula/compoundDOM/compoundObj
  symbolToElemObj(symbol, compoundSmth) {
    if (compoundSmth instanceof Node) return this.symbolToElemObjByCompDOM(symbol, compoundSmth);
    if (typeof compoundSmth == 'string') return this.symbolToElemObjByFormula(symbol, compoundSmth);
    if (compoundSmth instanceof CompoundObj) return compoundSmth[symbol];   
  }
  //возвращает elementObj по символу элемента symbol и formula
  symbolToElemObjByFormula(symbol, formula) {
    return this.elementObjsArr.find(elementObj => elementObj.compoundObj.formula == formula && elementObj.symbol == symbol);
  }
  //возвращает elementObj по символу элемента symbol и compoundDOM
  symbolToElemObjByCompDOM(symbol, compoundDOM) {
    const compoundObj = this.compDOMToCompObj(compoundDOM);
    if (!compoundObj) return;
    return compoundObj[symbol];
  }  

  //возвращает elementObj, соответствующий elementDOM
  elemDOMToElemObj(elementDOM) {
    return this.elementObjsArr.find(elementObj => elementObj.elem == elementDOM);
  }

  //elementDOM -> formula: Reaction.getFormulaByDOM(elementDOM);
  
  //elementObj -> symbol: elementObj.symbol
  
  //elementObj -> elementDOM: elementObj.elem   
  

  //////////////
  // полиморф //
  ////////////// 
  //возвращает compoundObj/elementObj, соответствующий DOM
  getObjByDOM (chemicalDOM) {
    if (chemicalDOM.classList.contains("elem")) return this.elemDOMToElemObj(chemicalDOM);
    if (chemicalDOM.classList.contains("compound")) return this.compDOMToCompObj(chemicalDOM);
  }
} 





