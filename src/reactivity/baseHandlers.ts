import { isObject } from '../shared'
import { track, trigger } from './effect'
import { ReactiveFlags, reactive, readonly } from './reactive'

const get=createGetter()
const set=createSetter()
const readonlyGet=createGetter(true)
const shallowReadonlyGet=createGetter(true,true)

function createGetter(isReadonly=false,shallow=false){
  return function get(target,key){

    if(key===ReactiveFlags.IS_REACTIVE){
      return !isReadonly
    }else if(key===ReactiveFlags.IS_READONLY){
      return isReadonly
    }

    const res=Reflect.get(target,key)

    // 判断是否为shallow类型的 如果是 以下都无需执行
    if(shallow){
      return res
    }

    // 看res值是不是一个object（嵌套）
    if(isObject(res)){
      return isReadonly? readonly(res):reactive(res)
    }


    if(!isReadonly){
      track(target,key)
    }
    return res
  }
}

function createSetter(){
  return function set(target,key,value){
    const res=Reflect.set(target,key,value)

    trigger(target,key)
    return res
  }
}

export const mutablehandlers={
  get,
  set
}

export const readonlyHandlers={
  get:readonlyGet,
  set(target,key,value){
    console.warn(`key:${key}set 失败  因为target是readonly`, target)
    return true
  }
}

export const shallowReadonlyHandlers=Object.assign({},readonlyHandlers,{
  get:shallowReadonlyGet
})