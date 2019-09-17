class ExercizePiece {
  //метод отправки события изменения содержания инпута
  sendTrialEvent() {
    console.log('sent Trial');
    const event = new CustomEvent('trial', {
      bubbles: true,
      cancelable: true,
      detail: {} //========================> что указывать в detail? 
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      // когда будут таблицы, здесь нужно будет указывать состоятние reactionTree, причем, обновляя его //
      ////////////////////////////////////////////////////////////////////////////////////////////////////
    });
    console.log(this);
    //отправляем именно от элемента при инпуте, а не от самого инпута, т.к. для временных инпутов отправка 
    //происходит после их удаления со страницы, и соответственно их сообытия не доходят.  
    this.elem.dispatchEvent(event);
  }
}



class Exercize {
  constructor(options) {
    //вот тут надо подумать, как лучше сделать чтобы передавался элемент вместе с опциями
    this.elem = options.elem; 
  }
  activate() {
    const self = this;
    this.__onTrial = self.onTrial.bind(self);
    this.elem.addEventListener('trial', this.__onTrial);
  } 
  //при попытке решения проверяем, задано ли решение и если да, то выполненно ли оно
  onTrial() {
    console.log('cathced a trial!');
    //проверка на правильное решение. осуществляется только если решение существует
    if (this.ifHasSolution() && this.ifSolved()) {
      console.log('Solved');
      this.onComplete(); 
    }
  }
  //действия по выполнению задания
  sendCompleteEvent() {
    const completeEvent = new CustomEvent('complete', {
      bubbles: true,
      cancelable: true,
      detail: {}
    });
    this.elem.dispatchEvent(completeEvent);
    //удаляем наблюдателей
    alert('Андрей молодец!');
  }
  //возвращает true, если для данной реакции заданы условия правильного решения
  ifHasSolution() {
    return (this._SOLUTION && this._SOLUTION.length != 0) ? true : false;
  }
  //возвращает true, если все условия правильного решения выполнены, иначе - false
  ifSolved() {
    return this._SOLUTION.every( entry => entry.current == entry.correct) ? true : false;
  }
  //устанавливает опции из аттрибута options this.elem
  setPredefined() {
    const options = this.elem.dataset.options; 
    // делаем из options объкт и передаем его в set(options)
    if (options) {
      const optionsObj = JSON.parse(options.replace(/'/g,'"'));
      this.set(optionsObj);
    }
  }
}


//////////////////////
//добавить описание //
//править код       //
//////////////////////
class ComplexExercize {
  constructor(options) {
    const {elem, reaction, balance} = options;

    const subExercizes = elem.querySelectorAll('.subExercize');
    //недоступные для решения подзадания (изначально - все) помечаем классом .inactive, чтобы
    //визуально отличать от активного подзадания
    subExercizes.forEach( subEx => subEx.classList.add('inactive'));

    let count = 0;
    setSubEx(count);

    reaction && reaction.elem.addEventListener('complete', onCompleteSubEx);
    balance && balance.elem.addEventListener('complete', onCompleteSubEx);

    function onCompleteSubEx(e) {
      markCompleteSubEx(count);
      if (![...subExercizes].every(subExercize => subExercize.classList.contains('complete'))) {
        e.stopPropagation(); 
        count++;
        setSubEx(count);
        return;
      }
      e.currentTarget.removeEventListener('complete', onCompleteSubEx);
    }

    function markCompleteSubEx(count) {
      subExercizes[count].classList.add('complete');
    }

    function setSubEx(count) {
      //текущее подзадание выделяем визуально удаляя класс .inactive
      subExercizes[count].classList.remove('inactive');
      const options = subExercizes[count].dataset.options;
      const optionsObj = JSON.parse(options.replace(/'/g,'"'));
      const target = subExercizes[count].dataset.target || 'reaction';
      //setTimeout надо затем, что когда у реакции выполняется solution, автоматом проставляется set({solution:'none', editable:'none'})
      //если не сделать setTimeout, то новое условие не поставится 
      if (target == 'reaction') setTimeout(reaction.set.bind(reaction, optionsObj), 0);
      if (target == 'balance') {
        if (!balance) throw new Error('should have balance', this);
        setTimeout(balance.set.bind(balance, optionsObj), 0);
      }
      console.log('setting options for ', balance, 'options:', optionsObj, options);
    }
  }
}

//инпут как самостоятельное урпажнение - имеет решение, ловит событие 
//onTrial и каждый раз выполняет проверку на корректность. Когда решено - выполняет onComplete
//в котором выполняет отправку события complete
class ExercizeTestInput {
  set(options) {
    const {solution} = options;
    this.correct = solution;

    Object.defineProperty(this, 'current', {
      get: function() {
              return this.input.value;
            },
            enumerable: true,
            configurable: true
    });
    
    this._SOLUTION = [];
    this._SOLUTION.push(this);
  }
}



