export function SidebarItem({ title, icon }: { title: string; icon: any }) {
  return (
    <div className="flex items-center p-2 hover:bg-gray-700 rounded">
        <span className="mr-6 ml-4">{icon}</span>
        <span>{title}</span>    
    </div>
  );
}
