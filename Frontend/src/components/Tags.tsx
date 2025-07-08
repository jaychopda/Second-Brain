interface TgasProps{
  tagTypes : string
}

const Tags = (props: TgasProps)=>{
  return <div className="px-3 py-1 text-lg bg-blue-100 rounded-2xl text-blue-500">
      #{props.tagTypes} 
  </div>
} 

export default Tags;