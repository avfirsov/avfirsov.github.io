//класс для матрицы уравнения химической реакции 
class ReactionMatrix {
  constructor(options) {
    this.reactionTree = options.reactionTree;
    this.solved = false;
  }
  //создает и возвращает матрицу в формате двумерного массива для ReactionTree.
  // устройство матрицы: строки соответствуют всем элементам которые есть в уравнении,
  // столбцы - веществам в уравнении. Каждая ячейка содержит число, сколько атомов данного
  // элемента содержиться в 1 молекуле данного вещества, со знаком "+" если вещество - реагент,
  // и со знаком "-", если вещество - продукт  
  make() {
    const reactionTree = this.reactionTree;
    const elements = reactionTree.getElementsList();
    const matrix = [...elements].map( (symbol) => {
      const string = [];
      reactionTree.compoundObjsArr.forEach( compoundObj => {  
        string.push(compoundObj.getQuantity(symbol) / compoundObj.coefficient); 
      });
      return string;
    });
    console.log('made matrix', JSON.parse(JSON.stringify(matrix)));
    this.matrix = matrix;
  }
  //диагонализирует матрицу this.matrix и сохраняет новую матрицу в this.diagMatrix
  diagonalize() {
    if (!this.matrix) this.make();
    //копируем матрицу чтобы не повредить исходную
    let diagMatrix = this.matrix.slice(); 
    console.log('Copy of matrix:', JSON.parse(JSON.stringify(diagMatrix)));
    //число строк после обрезания пустых строк, будет меняться, поэтому let
    //для каждой строки
    //если строка состоит только из нулей - стираем ее из матрицы  
    diagMatrix = ReactionMatrix.clearZeroStrings(diagMatrix);
    console.log('Clearing null strings:', JSON.parse(JSON.stringify(diagMatrix)));
    //суть алгоритма в следующем: 
    //1) для каждой строки, ищем такие строки, которые могли бы быть на месте этой строки в диагональной матрице
    //2) берем одну из таких строк и меняем местами с текущей
    //3) вычитаем новую диагональную строку, из других такой же длины
    diagMatrix.forEach( (string, strNo) => {
      //в процессе будем убирать лишние строки, поэтому нужно проверить, что не зашли на одну из таких убранных строк
      if (!string) return;
      //здесь будем хранить номера строк, которые диагонализируем в этой итерации. из них будем вычитать текущую string
      const toDiag = [];
      //ищем строки, у которых первый ненулевой символ идет по счету слева таким же, как и номер этой строки, 
      //а все предыдущие символы в строке - нули. Т.е. для 0 строки, ищем строки где самый первый (0-й) символ != 0,
      //для 1-й: где 1-й символ != 0, а 0-й равен 0 и т.д. Т.е. по сути, ищем строки которые могут образовать диагональ
      //номера найденных строк пушим в toDiag[]
      console.log('Loop no', strNo, 'diagMatrix', JSON.parse(JSON.stringify(diagMatrix)));
      diagMatrix.forEach( (string, i) => {
        //в процессе будем убирать лишние строки, поэтому нужно проверить, что не зашли на одну из таких убранных строк
        if (!string) return;
        if ( string[strNo] != 0 && string.slice(0,strNo).every(elem => elem == 0)) toDiag.push(i); 
      });
      //таким образом все строки toDiag имеют strNo-1 нулей в начале и strNo-й элемент строго ненулевой
      //т.е. это множество строк, которые для могут на данной строке образовать диагональ
      //берем первую строку подходящей длины из числа toDiag и меняем ее местами с текущей строкой 
      console.log('Loop no', strNo, 'toDiag:', toDiag);
      if (!isNaN(toDiag[0])) diagMatrix = ReactionMatrix.exchangeStrings(diagMatrix, strNo, toDiag.shift());  
      console.log('Loop no', strNo, 'After exhange strings diagMatrix', JSON.parse(JSON.stringify(diagMatrix)));
      //убираем нулевые строки, если такие образовались после вычитания строк
      diagMatrix = ReactionMatrix.cutToZeroStrings(diagMatrix, strNo, toDiag);
      console.log('Loop no', strNo, 'After cutToZero strings diagMatrix', JSON.parse(JSON.stringify(diagMatrix)));
    });
    this.diagMatrix = diagMatrix;
  }
  //получает по диагонализированной матрице массив коэффициентов coeffs, сохраеняет его в this.coeffs и возвращает this.coeffs 
  //если найдены корректные коэффициенты. Иначе - возвращает undefined. 
  getCoeffs() {
    if (this.coeffs) return this.coeffs;
    if (!this.diagMatrix) this.diagonalize();
    const diagMatrix = this.diagMatrix.slice(); 
    //количество строк в диагонльной матрице
    const m = diagMatrix.length;
    //пустой массив длины сколько всего веществ в реакции
    let coeffs = new Array(diagMatrix[0].length);
    //обращаем порядок строк в диагональной матрице 
    diagMatrix.reverse();
    //перебор по строкам диагональной матрицы в обратном порядке
    diagMatrix.forEach( (string, i) => {
      //в этом массиве будем хранить номера позиций занятые числами для данной строки, которые находятся на позициях элементов,
      //для которых мы еще не знаем коэффициент. Дальше мы будем выражать их друг через друга. 
      //В теории, их может быть сколько угодно, но коэффициенты можно будет выразить друг через друга
      //только если их будет не больше 2.
      const unknown = [];
      //для всех чисел в строке, которые находятся на местах с известными коэффициентами,
      //подсчитываем сумму: число * коэффициент (для того же вещества)
      const sum = string.reduce( (sum, current, i) => {
        if ( current == 0 ) return sum;
        //если в нашем массиве уже есть коэффициент для i-о вещества - добавляем в сумму текущий * этот коэффициент              
        if ( coeffs[i] != undefined ) return sum + current * coeffs[i];
        //если в нашем массиве еще нету коэффициента для i-о вещества - вносим его в массив
        unknown.push(i); 
        return sum;
      },0);
      //количество неизвестных коэффициентов в строке матрицы
      const ul = unknown.length;
      //если в данной строки 1 коэффициент неизвестен, а остальные - известны, то:
      //если это единственный коэффициент в строке - отбой
      if ( ul == 1 && string.reduce( (sum, current) => sum + !!current, 0) == 1) return;
      //иначе, находим его так:  
      if ( ul == 1 ) coeffs[unknown[0]] = -1 * sum / string[unknown[0]];
      //если в данной строки сразу 2 неизвестных коэффициента, один из них принимаем равным 1, а второй находим по разности
      if ( ul == 2 ) {
        coeffs[unknown[1]] = 1;
        coeffs[unknown[0]] = -1 * string[unknown[1]] / string[unknown[0]];
      }
    });
    console.log(coeffs);
    if ( coeffs.some(x => x <= 0 || x == Infinity || isNaN(x)) || coeffs.every(x => x == 0) ) throw new Error('cant solve');
    //находим самый маленький из коэффициентов
    const minCoef = Math.min(...coeffs);
    //и делим на него каждый коэффициент - это чтобы самый маленький из коэффициентов стал равен (или почти равен) 1.
    coeffs = coeffs.map(x => x / minCoef);
    //вполне возможно, часть из найденных коэффициентов окажется дробной, например если 1.33, а нам нужны целые коэффициенты
    //поэтому делаем так: берем целое число 2, умножаем на него все коэффициенты, округляем, и смотрим, не сильно расходятся
    //округленнные и неокругленные коэффициенты. если сильно, берем следующее число, 3, и так далее. Наша задача - подобрать
    //целый множитель так, чтобы КАЖДЫЙ коэффициент был близок к целому числу (точность - параметр precision)
    let n = 1;
    while (!ReactionMatrix.roundEnough(coeffs)) {
      coeffs = coeffs.map(x => x * (n + 1) / n );
      n++;
      if ( n > 20 ) {
        console.log('Ошибка округления');
        break;
      }
    }
    console.log('Найденный множитель:', n + 1, 'Новые целые коэффициенты: ', coeffs);
    this.coeffs = coeffs.map(x => Math.round(x));
    if (this.ifSolved()) {
      this.solved = true;
      return this.coeffs.slice();
    } 
    return undefined;
  }
  //считает сумму для каждой строги исходной матрицы: число * коэффициент на этом же месте
  //для каждой строки сумма должна получится равной 0
  //иначе коэффициенты найдены неверно
   ifSolved () {
    this.matrix.forEach( (string, strNo) => {
      const sum = string.reduce((sum, current, i) =>{
        sum + current * this.coeffs[i];
      }, 0);  
      if (sum != 0) return false;
    });
    return true;
  }
  //осуществляет проверку, что сумма элементов массива coeffs по модулю отличается от суммы ближайших к ним 
  //целых чисел не более чем на 5% (параметр precision). Короче говоря, true, если каждый элемент массива достаточно близок к целому числу. Иначе - false.
  static roundEnough(arr, precision = 0.03) {
    const sum = arr.reduce((sum, current) => {
      console.log(Math.abs((current - Math.round(current)) / current));
      return sum + Math.abs((current - Math.round(current)) / current);
    },0);
    console.log(sum, precision * arr.length);
    return  sum < precision * arr.length ? true : false; 
  }
  // меняет местами строки с номерами str1 и str2 в матрице matrix, возвращает результат в новой матрице 
  static exchangeStrings(matrix, str1, str2) {
    console.log('Exhanging strings',str1, str2, 'in matrix: ', JSON.parse(JSON.stringify(matrix)));
    const newMatrix = matrix.slice();
    [newMatrix[str1],newMatrix[str2]] = [newMatrix[str2],newMatrix[str1]];
    console.log('Exhanged strings',str1, str2, 'New matrix: ', JSON.parse(JSON.stringify(newMatrix)));
    return newMatrix;
  };
  //вычитает строку с номером str из строк с номерами из массива strings матрицы matrix домножая на коэффициент так,
  //что первый ненулевой символ в каждой строке strings станет равен 0 
  //(при условии, что порядковый номер первого ненулевого символа в str и в каждой из strings совпадает)
  //возвращает новую обрезанную матрицу
  static cutToZeroStrings(matrix, str, strings) {
    if (!matrix[str] || strings.some(string => !matrix[string])) return matrix;
    let newMatrix = matrix.slice();
    strings.forEach( cutStr => {
      //находим коэффициент, на который надо домножить строку с номером str, чтобы при вычитании из строки с номером
      //cutStr у той занулилось число под первым ненулевым числом в строке str
      const coef = -1 * newMatrix[cutStr][str] / newMatrix[str][str];
      newMatrix[cutStr].forEach( (cutElem, i, currentStr) => {
        //только для символов с номерами больше чем номер вычитаемой строки str
        if (i < str) return;
        currentStr[i] = cutElem + newMatrix[str][i] * coef;
      });
    });
    newMatrix = ReactionMatrix.clearZeroStrings(newMatrix);
    return newMatrix;
  }
  //убирает из матрицы нулевые строки
  static clearZeroStrings(matrix) {
    //создаем копию исходной матрицы
    let clearMatrix = matrix.slice();
    clearMatrix.forEach( (string, i) => {
      //поскольку в процессе строки будут удаляться, если forEach нарвется на удаленную строку - прекращаем
      if (!string) return;
      if (string.reduce((sum, current) => sum + (current != 0) ,0) == 0 ) clearMatrix.splice(i,1);
    });
    clearMatrix = clearMatrix.filter(Boolean);
    return clearMatrix;
  }
}