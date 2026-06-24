import { useState } from 'react';
import { useDomainStore } from '../stores/domainStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';

function DomainManagement() {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [editingPrompt, setEditingPrompt] = useState('');
  
  const {
    categories,
    selectedCategoryId,
    addCategory,
    updateCategory,
    deleteCategory,
    selectCategory,
    getCategoryById,
    getChildCategories,
  } = useDomainStore();

  const level1Categories = categories.filter((c) => c.level === 1);
  const selectedCategory = selectedCategoryId ? getCategoryById(selectedCategoryId) : null;

  const handleAddLevel1 = () => {
    if (!newCategoryName.trim()) {
      toast.error('请输入分类名称');
      return;
    }
    addCategory(newCategoryName, null);
    setNewCategoryName('');
    toast.success('分类已添加');
  };

  const handleAddLevel2 = (parentId: string) => {
    if (!newSubCategoryName.trim()) {
      toast.error('请输入子分类名称');
      return;
    }
    addCategory(newSubCategoryName, parentId);
    setNewSubCategoryName('');
    toast.success('子分类已添加');
  };

  const handleSelectCategory = (categoryId: string) => {
    selectCategory(categoryId);
    const cat = getCategoryById(categoryId);
    if (cat && cat.level === 2) {
      setEditingPrompt(cat.prompt || '');
    }
  };

  const handleSavePrompt = () => {
    if (!selectedCategoryId) return;
    
    const cat = getCategoryById(selectedCategoryId);
    if (cat && cat.level === 2) {
      updateCategory(selectedCategoryId, { prompt: editingPrompt });
      toast.success('提示词已保存');
    } else {
      toast.error('只能为二级分类设置提示词');
    }
  };

  const handleDelete = (categoryId: string) => {
    toast(
      '确定删除此分类吗？',
      {
        description: '子分类也会被删除',
        position: 'top-center',
        action: {
          label: '删除',
          onClick: () => {
            deleteCategory(categoryId);
            toast.success('分类已删除');
          },
        },
        cancel: {
          label: '取消',
          onClick: () => {},
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-semibold text-ink mb-2">
          领域管理
        </h2>
        <p className="text-muted">管理翻译领域和约束提示词</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-ink">领域分类</h3>
          </div>

          <div className="mb-4 flex gap-2">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="新一级分类"
              className="text-sm"
            />
            <Button onClick={handleAddLevel1} size="sm">
              添加
            </Button>
          </div>

          <div className="space-y-1 text-sm">
            {level1Categories.map((cat) => {
              const children = getChildCategories(cat.id);
              return (
                <div key={cat.id} className="space-y-1">
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedCategoryId === cat.id
                        ? 'bg-accent/10 text-accent'
                        : 'hover:bg-accent-tint text-ink'
                    }`}
                    onClick={() => handleSelectCategory(cat.id)}
                  >
                    <span className="font-medium">{cat.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(cat.id);
                      }}
                      className="text-muted hover:text-red-600 text-xs h-auto p-1"
                    >
                      删除
                    </Button>
                  </div>

                  {children.map((child) => (
                    <div
                      key={child.id}
                      className={`flex items-center justify-between pl-6 pr-2 py-1 rounded-lg cursor-pointer transition-colors ${
                        selectedCategoryId === child.id
                          ? 'bg-accent/10 text-accent'
                          : 'hover:bg-accent-tint text-muted'
                      }`}
                      onClick={() => handleSelectCategory(child.id)}
                    >
                      <span className="text-xs">└ {child.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(child.id);
                        }}
                        className="text-muted hover:text-red-600 text-xs h-auto p-1"
                      >
                        删除
                      </Button>
                    </div>
                  ))}

                  {selectedCategoryId === cat.id && cat.level === 1 && (
                    <div className="pl-6 pr-2 py-1 flex gap-2">
                      <Input
                        type="text"
                        value={newSubCategoryName}
                        onChange={(e) => setNewSubCategoryName(e.target.value)}
                        placeholder="新二级分类"
                        className="text-xs"
                      />
                      <Button
                        onClick={() => handleAddLevel2(cat.id)}
                        size="sm"
                      >
                        添加
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-ink">
              {selectedCategory
                ? `${selectedCategory.name} - 提示词编辑`
                : '提示词编辑'}
            </h3>
            {selectedCategory && selectedCategory.level === 2 && (
              <Button onClick={handleSavePrompt}>
                保存
              </Button>
            )}
          </div>

          {!selectedCategory ? (
            <div className="flex items-center justify-center h-96 text-muted">
              请选择一个二级分类来编辑提示词
            </div>
          ) : selectedCategory.level === 1 ? (
            <div className="flex items-center justify-center h-96 text-muted">
              请选择二级分类来编辑提示词（一级分类不支持）
            </div>
          ) : (
            <>
              <Textarea
                value={editingPrompt}
                onChange={(e) => setEditingPrompt(e.target.value)}
                className="h-80 mb-4"
                placeholder="领域约束提示词将显示在此...

示例格式：
## 领域背景
{简要描述该领域的特点}

## 术语库（中英对照）
- 中文术语 -> English Term
- ...

## 常见误译提示
- 避免将 X 翻译为 Y，应翻译为 Z
- ...

## 翻译风格建议
- 该领域倾向于{正式/科普/技术}风格
- ..."
              />
              
              <div className="text-sm text-muted">
                提示：此提示词将在翻译时作为领域约束条件传递给大模型，帮助生成更专业准确的翻译结果。
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default DomainManagement;
