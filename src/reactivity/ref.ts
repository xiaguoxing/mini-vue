import { hasChanged, isObject } from '../shared';
import { isTracking, trackEffects, triggerEffects } from './effect';
import { reactive } from './reactive';


class RefImpl{
  private _value: any;
  // dep收集依赖
  public dep;
  private _rawValue: any;
  // ref的标记
  public __v_isRef=true

  constructor(value){
    this._rawValue=value
    // 如果传入对象 用reactive进行包裹
    this._value=convert(value)
    this.dep=new Set()
  }

  get value(){
    if(isTracking()){
      // 收集依赖
      trackEffects(this.dep)
    }
    
    return this._value
  }

  set value(newValue){
    // 一定是先修改value值 再通知

    // 如果赋值相同 不进行接下来赋值操作
    if(hasChanged(newValue,this._rawValue)){
      this._rawValue=newValue
      this._value=convert(newValue)

      triggerEffects(this.dep)
    }
  }
}

function convert(value){
  return isObject(value)?reactive(value):value
}

export function ref(value){
  return new RefImpl(value)
}

export function isRef(ref){
  return !!ref.__v_isRef
}

export function unRef(ref){
  // 看看ref是不是ref类型 如果是返回ref的value 不是直接把值返回
  return isRef(ref)?ref.value:ref
}

export function proxyRefs(objectWithRefs){
  return new Proxy(objectWithRefs,{
    get(target,key){
      // 如果是ref 返回.value  不是直接返回值
      return unRef(Reflect.get(target,key))
    },
    set(target,key,value){
    // 如果原来是ref类型 给的新值不是ref类型
      if(isRef(target[key]) && !isRef(value)){
        // 把新值赋值给原来value
        return (target[key].value=value)
      }else{
        // 如果给的是ref类型 直接替换
        return Reflect.set(target,key,value)
      }
    }
  })
}