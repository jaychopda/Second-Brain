import '../App.css'
import { Button } from '../components/Button'
import Card from '../components/Card'
import { PlusIcon } from '../icons/PlusIcon'
import { ShareIcon } from '../icons/ShareIcon'
import { CreateContentModel } from '../components/CreateContentModal'
import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import axios from 'axios'

function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [contents, setContents] = useState<any[]>([]);

  // Fetch contents on mount
  useState(() => {
    axios.get("http://localhost:3000/api/v1/content", {
      headers: {
        token: localStorage.getItem("token") || ""
      }
    }).then(response => {
      setContents(response.data.contents);
    }).catch(error => {
      console.error("Error fetching contents:", error);
      setContents([]);
    });
  });


  return (
    <div className='flex'>
      <div>
        <Sidebar />
      </div>
      <div className='p-4 w-full'>

        <CreateContentModel open={modalOpen} onClose={() => setModalOpen(false)} />

        <div className='flex justify-end gap-4'>
          <Button variant="primary" text="Add Content" size="sm" startIcon={<PlusIcon />} onClick={() => setModalOpen(true)} />
          <Button variant="secondary" text="Share Brain" startIcon={<ShareIcon />} onClick={() => alert('Button Clicked!')} size="sm" />
        </div>

        <div className='flex gap-4 mt-16'>
          {/* <Card type="Youtube" tag={["Productivity"]} title="Sample Video" link="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
          <Card type="Twitter" tag={["Mindset"]} title="Sample Tweet" link="https://x.com/narendramodi/status/1941866458947911925" />
          <Card type="Notion" tag={["Workflows"]} title="Sample Notion" link="https://www.notion.so/sample-page" /> */}

          {contents.map((content: any, index: number) => (
            <Card
              key={index}
              type={content.type}
              tag={content.tags.map((tag: any) => tag.title)}
              title={content.title}
              link={content.link}
              date={new Date(content.createdAt).toLocaleDateString()}
              reload={() => window.location.reload()}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard