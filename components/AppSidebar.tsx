'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupAction,
  SidebarHeader,
} from "@/components/ui/sidebar"

import { Calendar, Home, Inbox, Search, Settings, Plus } from "lucide-react"

import { Category } from "@/types/task";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useState } from "react";

export function AppSidebar() {
  const [categories, setCategories] = useLocalStorage<Category[]>("categories", []);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");

  function addCategory(category: Category) {
    setCategories([...categories, category]);
  }

  function handleAddCategory() {
    if (newCategoryTitle.trim()) {
      const newCategory: Category = {
        id: Date.now().toString(),
        title: newCategoryTitle.trim()
      };
      addCategory(newCategory);
      setNewCategoryTitle("");
      setIsAddingCategory(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleAddCategory();
    } else if (e.key === 'Escape') {
      setIsAddingCategory(false);
      setNewCategoryTitle("");
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
        <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <span className="text-base font-semibold">Compete Task Manager</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
        <SidebarGroupAction 
          title="Add Tag"
          onClick={() => setIsAddingCategory(true)}
        >
        <Plus /> <span className="sr-only">Add Tag</span>
      </SidebarGroupAction>
          <SidebarGroupLabel>Tags</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isAddingCategory && (
                <SidebarMenuItem>
                  <div className="flex gap-2 p-2">
                    <input
                      type="text"
                      value={newCategoryTitle}
                      onChange={(e) => setNewCategoryTitle(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={handleAddCategory}
                      placeholder="カテゴリー名を入力..."
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                </SidebarMenuItem>
              )}
              {categories.map((category) => (
                <SidebarMenuItem key={category.id}>
                  <SidebarMenuButton asChild>
                    <a href={`#${category.id}`}>
                      <span>{category.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}