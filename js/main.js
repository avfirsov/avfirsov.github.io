/////////////
// Миксины //
/////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//примешиваем в класс ReactionInput метод sendTrialEvent - общий метод для всех тренировочных элементов //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
classMixin(ReactionInput, ExercizePiece);

//инпут-как-упражнение, ввод только цифр
class NumbersInputExercize extends ReactionInput{
  constructor(options) {
    super(options);
  }
  showInput() {
    const self = this;
    //вызываем метод родителя, который связывает this.value жестко с input.value
    const input = super.showInput();
    input.placeholder = "123";
    this.elem.prepend(input);
    // this._checkCurrentValue();
    //сохраняем ссылки на привязанные фукнции чтобы потом корректно удалить слушателей
    this.__onKeyPress = self._onKeyPress.bind(self);
    //добавляем наблюдателей.  
    //Любой ввод будет отправлять событие trial 
    this.input.addEventListener('keypress', this.__onKeyPress);
  }
  onComplete() {
    this.disable();
    this.sendCompleteEvent();
  }
}
//инпут-как-упражнение, ввод в формате изменения числа электронов
class DeltaElectronsInputExercize extends OxiStateInput{
  constructor(options) {
    super(options);
  }
  onComplete() {
    this.disable();
    this.sendCompleteEvent();
  }
}


//примешиваем в инпуты-как-упраженения методы классов Exercize (наличие правильного решения, проверяемость, оптравка completeEvent при правильном выполнении)
//и ExercizeTestInput (задание критерия правильного решения)
classMixin(NumbersInputExercize, ExercizeTestInput, Exercize);
classMixin(DeltaElectronsInputExercize, ExercizeTestInput, Exercize);

// метод showInput заимствуем у DeltaElectronsInput
DeltaElectronsInputExercize.prototype.showInput = DeltaElectronsInput.prototype.showInput;
  

//////////////////////////////////////////////////////
// Работа с кнопками К следующему/предыдущему уроку //
//////////////////////////////////////////////////////

const nextBtn = document.querySelector('.button.next');
const prevBtn = document.querySelector('.button.prev');

if (prevBtn) {
  const prevLesson = currentLesson - 1;
  coverLink(prevBtn, `${prevLesson == 1 ? 'index' : prevLesson}.html`);
}
  
if (nextBtn) nextBtn.classList.add('inactive');

if (currentLesson == 1) prevBtn.closest('a').style.visibility = 'hidden';



//////////////////////////////////////////////
// Настройки анимации и визуала кнопки menu //
//////////////////////////////////////////////
const menu = document.querySelector('.menu');
const modal = document.querySelector('.modal');
modal.querySelector('.container').innerHTML = `<h1>Перейти к уроку:</h1>${COURSE_MAP}`;

const lessonsList = [...modal.querySelector('ul').querySelectorAll('li')];
const menuIcon = menu.querySelector('i');
const scrollBarWidth = getScrollBarWidth();
const menuStyle = getComputedStyle(menuIcon);  



lessonsList.forEach( (li, i) => {
  if (i > lastSolvedLesson) {
    li.innerHTML = li.textContent;
    li.classList.add('inactive');
  }
}); 


modal.addEventListener('transitionend', modalTransformed);

menu.onclick = function() {
  if (!document.body.classList.contains('modal-shown')) {
    modal.classList.add('shown');
    menu.classList.add('modal-shown');
    setTimeout(function(){
      modal.classList.add('wideX')}, 10);
  } else {
    modal.classList.add('shrinking');
    //чтобы не дрожжала кнопка меню при удалении/появлении полосы прокрутки
    menu.querySelector('i').style.left = '-72px';
    menu.classList.remove('modal-shown');
    modal.classList.remove('wideY');
    document.body.classList.remove('modal-shown');
  }
}


function modalTransformed() {
  //выполняется только в самом конце сжатия
  if (!this.classList.contains('wideX')) {
    console.log('первый if', Date.now());
    this.classList.remove('shown'); 
    modal.classList.remove('shrinking');
    return;
  }
  if (!this.classList.contains('wideY') && !modal.classList.contains('shrinking')) {
    console.log('второй if', Date.now());
    this.classList.add('wideY');
    return;
  }
  if (!this.classList.contains('wideY') && modal.classList.contains('shrinking')) {
    console.log('третий if', Date.now());
    const self = this;
    setTimeout( () => self.classList.remove('wideX'), 0);
    return;  
  }
  //выполняется только в самом конце расширения
  if (this.classList.contains('wideY') && !document.body.classList.contains('modal-shown')) {
    console.log('последний if', Date.now());
    setTimeout( () => document.body.classList.add('modal-shown'), 50);
    //чтобы не дрожжала кнопка меню при удалении/появлении полосы прокрутки, надо сместить ее левее на половину ширину скролла
    menu.querySelector('i').style.left = `${parseInt(menuStyle.left) - scrollBarWidth / 2}px`;
    return;
  }
}



/////////////////////////////////////////////////////////////////////////////////////
//если есть блок с невыполненными упражнениями - сделать кнопку Далее неактивной,  //
//пока не будут решены упражнения                                                  //
//                                                                                 //
// ДЛЯ ДЕМО ПОКА ЗАКОММЕНТИМ                                                       //
/////////////////////////////////////////////////////////////////////////////////////
//Все упражнения в документе должны быть в контейнере <.exercizes>
//Каждое упражнение внутри <.exercizes> находится в отдельном DIV <.exercize>
//Когда упражнение выполненно, оно посылает событие complete
//Exercizes ловит эти complete и все, кроме для последнего выполненного упражнения, задерживает. 
//Когда выполнено последнее упражнение в блоке (порядок выполнения не важен), его complete 
//пропускается и ловится документом. Когда документ ловит complete, кнопка Далее становится активной
//Внутри упражнения <.exercize> могут быть подзадачи <.subexercize>, каждое из которых
//также имеет статус Выполнено/не выполнено. В этом случае упражнение отправит complete
//только если все его подзадачи выполненны. 
const exercizesDiv = document.querySelector('.exercizes'); 
//Если все упражнения выполненны - у <.exercizes> есть класс "complete"
//если класса нету, т.е. есть невыполнненые упражнения - сделать кнопку Далее неактивной
if  ((lastSolvedLesson >= currentLesson) && nextBtn) makeNxtBtnActive();



//замораживает Далее пока все не решено
//когда все задачи будут выполнены, документ словит complete и кнопка Далее станет активной
//контейнер упражнений <.exercizes> следит за выполнение упражнений и отправит complete только
//когда последнее упражнение будет доделано. Порядок выполнения не важен.
if (exercizesDiv) {
  document.addEventListener('complete', onCompleteAll);
  const exercizes = exercizesDiv.querySelectorAll('.exercize');
  if (exercizes.length == 0) onCompleteAll();
  [...exercizes].forEach( exercize => {
    exercize.addEventListener('complete', onCompleteExercize);
  });
  //обработчик выполнения упражнения
  function onCompleteExercize(e) {
    const target = e.currentTarget;
    target.classList.add('complete');
    target.removeEventListener('complete', onCompleteExercize);
    if (![...exercizes].every( exercize => exercize.classList.contains('complete'))) e.stopPropagation();
    console.log('Solved exercize', target);
  }
} else if (lastSolvedLesson < currentLesson) {
  onCompleteAll();
}

function saveCurrentAsLast() {
  document.cookie = `lastSolvedLesson=${currentLesson}`;
}

function openNextLessonFromMenu() {
  lessonsList.forEach( (li, i) => {
    if (li.textContent != li.innerHTML) return;
    if (i > currentLesson) return;
    const lessonURL = i == 0 ? 'index.html' : `${i + 1}.html`;
    
    coverLink(li.firstChild, lessonURL);

    li.classList.remove('inactive');
  });
}

function makeNxtBtnActive() {
  if (!nextBtn.classList.contains('inactive') || !nextBtn) return; 
  nextBtn.classList.remove('inactive');
  const nextLesson = currentLesson + 1;
  coverLink(nextBtn, `${nextLesson}.html`);
}

//обработчик выполнения всех упражнений
function onCompleteAll() {
  document.removeEventListener('complete', onCompleteAll);
  console.log('Solved all exercizes');
  if (lastSolvedLesson < currentLesson) {
    //переписать куки
    saveCurrentAsLast();
    //открыть доступ к след уроку через меню
    openNextLessonFromMenu();
    if (nextBtn) makeNxtBtnActive();
  }
}


///////////
//SOCIAL //
///////////
const vk = document.getElementById('vk');
const tg = document.getElementById('tg');
const fb = document.getElementById('fb');
const twt = document.getElementById('twt');

//TUTLE точно правильный находится
const TITLE = document.title;
const URL = window.location.href;


//Возможно надо будет переделать ссылки
vk.onclick = function() {
  genericSocialShare(`https://vk.com/share.php?url=${URL}`);
}

tg.onclick = function() {
  genericSocialShare(`https://telegram.me/share/url?url=${URL}&text=${TITLE}`);
}

fb.onclick = function() {
    genericSocialShare(`http://www.facebook.com/share.php?u=${URL}&title=${TITLE}`);
  }

twt.onclick = function() {
  genericSocialShare(`http://twitter.com/home?status=${TITLE}+${URL}`);
}













///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ЗАПРЕТ ВЫДЕЛЕНИЯ                                                                                              //
//запрещаем выделение всего, что подходит под указанные селекторы или лежит внутри элементов, подходящих под них //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const unselectable = ['.menu', '.button', '.modal'];
document.addEventListener('selectstart', preventSelection);

function preventSelection(e) {
  const target = e.target.nodeType == 1 && e.target || e.target.parentElement;
  console.log('selected', target, unselectable.some(selector => target.closest && target.closest(selector)));
  if (unselectable.some(selector => target.closest && target.closest(selector))) {
    e.preventDefault();
    return false;
  }
}



//обработка реакций в тексте
//начнем с того, что обрамим все формулы в <div class="reaction"></div>
//поскольку формулы - единственное на странцие что написано на английском языке, то формулы можно не обрамлять вручную,
//а просто автоматически обрамлять в div'ы все, написанно на английском 
//только делать это надо будет РЕКУРСИВНО. сейчас нельзя залезть в элементы внутри
const content = document.querySelector('.content');
//селекторы, по которым НЕ надо оборачивать реакции
//например, хотим в тексте записать реакцию сами, чтобы указать параметры, 
//например, при верстке задач.  
const exclusions = [".reaction", "noArrow", "menu"];
coverReactions(content);
//рекурсивно проходит все вложенные элементы в элементе elem и в каждом узле:
//1) заменяет стрелку на правильную
//2) если этот узел - текстовый - то ищет все реакции в нем и оборачивает в <div class="reaction">
function coverReactions(elem) {
  const childNodes = elem.childNodes;
  //рекурсивно обрабатываем все текстовые узлы, вложенные в elem
  //те из них, что находятся внутри элементов из перечня исключений, в них только 
  //заменяем стрелки. В остальных - оборачиваем реакции в div.reaction
  [...childNodes].forEach( currentNode => {
    if (currentNode.nodeType == 3) {
      currentNode.textContent = substituteArrow(currentNode.textContent);
    }
    if (currentNode.nodeType == 3 && !exclusions.some(x => currentNode.parentElement.matches(x))) {
      wrapReactions(currentNode);
      return;
    } 
    if (currentNode.nodeType == 1) {
      if (exclusions.some(x => currentNode.parentElement.matches(x))) return;
      coverReactions(currentNode); 
    }
  });
}
//в текстовом узле textNode находит все реакции и оборачиваем их в <div class="reaction">
//вставляет полученный результат вместо текущей textNode 
function wrapReactions(textNode) {
  //создаем массив с текстом текстового узла и очищаем сам узел
  const textArr = [...textNode.textContent];
  textNode.textContent = "";
  //начинаем с текущего текстового узла, если появится
  //новый узел, то мы его добавим после текущего
  let currentNode = textNode;
  let parsingReaction = false;

  textArr.reduce( (sum, current, i) => {
    //начало реакции отслеживаем как первый латинский символ 
    //когда не парсим реакцию
    if (isLatin(current) && !parsingReaction) {      
      //реакция может начаться не с символа элемента, а с цифры или скобки
      //поэтому обязательно проверяем предшествующий символ на то, не 
      //является ли он частью реакции, не будучи при этом латиницей
      //если да - то перенесем его из собранной суммы в новую реакцию 
      let lastSymbol = sum.slice(-1);
      const removeLast = fromReaction(lastSymbol);
      //записать в текущий узел текстовую сумму, если последний символ 
      //часть реакции - то без последнего символа
      currentNode.textContent += sum.slice(0,-1) + (removeLast ? "" : lastSymbol);
      //обнуляем текущую текстовую сумму
      sum = "";  
      //начинаем парсинг реакции
      parsingReaction = true;   
      //создаем div.reaction и помещаем сразу после текущего узла, куда потом поместим текст реакции
      const reaction = document.createElement('div');
      reaction.className = "reaction";
      currentNode.after(reaction);
      //делаем текущий узел div'ом с реакцией
      //если надо - сохраняем послдений символ 
      currentNode = reaction;
      reaction.textContent = removeLast ? lastSymbol : "";      
      //начинаем сборку реакции с текущего символа
      return current;
    }

    //конец реакции отслеживаем, как первый символ, не имеющий
    //отношения к реакции - не 1-9, не a-Z, не [,],(,),+,- и не " "
    if (parsingReaction && !isReaction(current)) {
      //сохраняем последний символ
      //некоторые символы могут встречаться только внутри реакций, но не
      //на конце - " ", (, [
      //если последний символ собранной суммы - из их числа, перенесем его в новый текст
      let lastSymbol = sum.slice(-1);
      const removeLast = notFromReaction(lastSymbol) || lastSymbol == " "; 
      //записываем в реакцию текущую текстовую сумму, если надо - включая последний символ
      currentNode.textContent += sum.slice(0,-1) + (removeLast ? "" : lastSymbol);
      //обнуляем текстовую сумму
      sum = "";
      //создаем новый текстовый узел сразу после реакции и если надо
      //записываем туда последний символ
      const text = document.createTextNode(current);
      currentNode.after(text);
      //делаем новый созданный текстовый узел текущим узлом 
      currentNode = text;
      text.textContent = removeLast ? lastSymbol : "";
      //прекращаем сбор реакции
      parsingReaction = false;
      //начинаем сборку текста с текущего символа
      return current;
    }
    //если текущий символ - послдений в тексте, то прекратить сбор и записать результат 
    if (i == textArr.length - 1) {
      currentNode.textContent += sum + current;
    }
    return sum + current;
  }, "");

}



// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// ДОВЕСТИ ДО УМА ЛОГИКУ ОБРАБОТЧИКА РЕАКЦИЙ НИЖЕ
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

//менеджер всех временных инпутов на странице (инпутов, которые появляются при клике по определенному месту на документе)
//чтобы не делать 100500 обработчиков для каждого инпута, делаем единый менеджер 
//с методами .initiate(), .addInput(inputObj);
const reactionInputsManager = new ReactionInputsManager();
reactionInputsManager.initiate();


const coefInputs = [];
const oxiInputs = [];
const reactionObjects = [];
const redoxBalanceObjs = [];
//обрабатываем все DIV.reaction, которые есть в документе
const reactions = document.querySelectorAll('.reaction');

reactions.forEach( reactionElem => {
  //в подзадачах DIV.reaction может встретится только как набранная формула,
  //такие DIV.reaction обходим стороной
  if (reactionElem.closest('.subExercize')) return;
  const reaction = new Reaction( {elem: reactionElem} );
  reaction.layout();
  // reaction.set({editable: 'none', solution: 'none'});

  //ищем <.exercize> вблизи нашей реакции 
  const exercize = reactionElem.closest('.exercize');
  //если в упражнении вместе с реакцией есть redoxBalance, запускаем его
  let redoxBalance;
  if (exercize) {
    redoxBalance = exercize.querySelector('.redoxBalance'); 
  }
  let redoxBalanceObj;
  if (redoxBalance) {
    const linkToID = redoxBalance.dataset.reaction;
    const reactionDOM = document.getElementById(linkToID);
    redoxBalanceObj = new RedOxBalance({elem: redoxBalance, reactionDOM});
    redoxBalanceObj.setPredefined();
    console.error(redoxBalanceObj);
    redoxBalanceObjs.push(redoxBalanceObj);
  }
  

  //если реакция находится внутри <.exercize>, то проверяем, нет ли внутри него <.subExercize>
  //если есть - для такого <exercise>  сделаем отдельный объект, который будет контролировать выполнение подзадач
  //а еще делаем проверку, что снаружи reaction нет <.subExercize> - !reaction.elem.closest('.subExercize')
  //это нужно потому что reaction могут быть внутри <.subExercize> использованы для формулировки заданий
  if (exercize && exercize.querySelector('.subExercize') && !reaction.elem.closest('.subExercize')) new ComplexExercize({elem: exercize, reaction: reaction, balance: redoxBalanceObj});

  ///////////////////////////////////////////////////////////////////////////
  //КОД НИЖЕ ПОКАЗЫВАЕТ СТЕПЕНИ ОКИСЛЕНИЯ ДЛЯ КАЖДОГО ЭЛЕМЕНТА НА СТРАНИЦЕ //
  ///////////////////////////////////////////////////////////////////////////
  // reaction.reactionTree.forEachElement( elementObj => {
  //   const input = new OxiStateInput({elem:elementObj.elem, reaction: reaction});
  //   input.showInput();
  //   input.value = elementObj.foundOxiState;
  //   input._checkCurrentValue();
  //   input.hide();
  // });
  



  //выделяем уравниваемые реакции, в которых не удалось найти коэффициенты
  //а там, где удалось - расставляем найденные коэффициенты
  ///////////////////////////
  //            ДЕМО РЕЖИМ //
  ///////////////////////////
  ///Выделяет то, что не может решить красным
  // if (reaction.reactionTree.products && !reaction.reactionTree.solve()) {
  //   reaction.elem.style.backgroundColor = 'red';
  // } 
  //////////////////////////////////////////////////////////////////////
  // КОД НИЖЕ ДЕЛАЕТ ПРАВИЛЬНЫЙ КОЭФФИЦИЕНТ КОЭФФИЦИЕНТОМ В УРАВНЕНИИ //
  //////////////////////////////////////////////////////////////////////
  // else reaction.reactionTree.compoundObjsArr.forEach( compoundObj => {
  //   const input = new CoefInput({elem:compoundObj.elem});
  //   input.showInput();
  //   input.value = compoundObj.foundCoefficient;
  //   input.hide();
  // });




  
  // берем аттрибут options и заменяем одинарные кавычки на двойные
  // потому что JSON.parse понимает только с двойными, а в HTML значение аттрибута может содержать только одинарные
  // 
  // 
  ////////////////////////////////////////////////
  // ======================== установка options //
  //////////////////////////////////////////////// 
  const options = reactionElem.dataset.options; 
  // делаем из options объкт и передаем его в set(options)
  if (options) {
    const optionsObj = JSON.parse(options.replace(/'/g,'"'));
    reaction.set(optionsObj);
  }
  reactionObjects.push(reaction);
});


//добавляем обработчик аттачей к реакциям, типа своего рода менеджер уровня документа
//Как альтернатива коду ниже можно сделать, чтобы реакция сама чухала что к ней прицепились,
//есть пару идей как это можно реализовать:
//  1) в каждую реакцию добавлять по обработчику на bind ивент, но в этом случае на странице будет 
//  тьма обработчиков 
//  2) присоединиться можно только в реакции у DOM которой есть ID, соответственно, можно проверять 
//  наличие аттрибута ID и ставить обработчик из реакции только при наличии ID. В этом случае
//  обработчиков на странице будет куда меньше, но не всегда ID у реакции означает что будет bind,
//  поэтому часть обработчиков может оказаться лишней
//  3) можно добавлять аттрибут data-bound="true" к DOM реакций, к которым будут присоединяться, но 
//  и потом уже из реакции, если есть аттрибут, ставить обработик, но это лишний аттрибут в HTML, 
//  а это гемор - напряг помнить каждый раз проставить этот аттрибут, а вдруг забудешь
// Поэтому я выбрал текущий формат: на всю страницу единый менеджер, 1 обработчик, который
// отлавливает события bind и делает всю необходимую работу.    
document.addEventListener('bind', onBind);

function onBind(e) {
  console.groupCollapsed('Cathed bind event', e);
  const elem = e.detail.reaction;
  const reaction = reactionObjects.find(reactionObj => reactionObj.elem == elem);
  if (!reaction.reactionTree) reaction.buildReactionTree();

  const sendData = new CustomEvent('sendData', {
    bubbles: true,
    detail: {reactionTree: reaction.reactionTree}
  });

  console.groupEnd('Cathed bind event', e);
  elem.dispatchEvent(sendData);
  console.log('sent data', sendData, elem);
}

//обрабатываем таблицы на странице
const elementsTablesArr = [];
const oxiStatesTablesArr = [];
//активируем таблицы элементов
const elementsTables = document.querySelectorAll('.elementsTable');
elementsTables.forEach(elementsTable => {
  const linkToID = elementsTable.dataset.reaction;
  const reactionDOM = document.getElementById(linkToID);
  
  const table = new ElementsTable({elem: elementsTable, reactionDOM});
  elementsTablesArr.push(table);
});


const redoxBalances = document.querySelectorAll('.redoxBalance'); 
redoxBalances.forEach(redoxBalance => {
    //если баланс в упражнении, то мы его уже разметили выше
    if (redoxBalance.closest('.exercize') || redoxBalance.children[0]) return;
    const linkToID = redoxBalance.dataset.reaction;
    const reactionDOM = document.getElementById(linkToID);
    const redoxBalanceObj = new RedOxBalance({elem: redoxBalance, reactionDOM});
    redoxBalanceObj.setPredefined();
    console.error(redoxBalanceObj);
    redoxBalanceObjs.push(redoxBalanceObj);
});



const oxiStatesTables = document.querySelectorAll('.oxiStatesTable');
oxiStatesTables.forEach(oxiStatesTable => {
  const linkToID = oxiStatesTable.dataset.reaction;
  const reactionDOM = document.getElementById(linkToID);
  
  const table = new OxiStatesTable({elem: oxiStatesTable, reactionDOM});
  oxiStatesTablesArr.push(table);
});


const NumbersInputExercizes = document.querySelectorAll('.NumbersInputExercize');
NumbersInputExercizes.forEach(exercize => {
  const inputObj = new NumbersInputExercize({elem: exercize, showCondition: 'always'});
  inputObj.showInput();
  inputObj.setPredefined();
  inputObj.activate();
});


const DeltaElectronsInputExercizes = document.querySelectorAll('.DeltaElectronsInputExercize');
DeltaElectronsInputExercizes.forEach(exercize => {
  const inputObj = new DeltaElectronsInputExercize({elem: exercize, showCondition: 'always'});
  inputObj.showInput();
  inputObj.setPredefined();
  inputObj.activate();
});
