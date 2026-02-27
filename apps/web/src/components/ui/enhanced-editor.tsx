'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import { TableKit } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import { common, createLowlight } from 'lowlight';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Code,
    Quote,
    Highlighter,
    Link as LinkIcon,
    Table as TableIcon,
    Undo,
    Redo,
    Strikethrough,
    FileText,
    Download,
    Upload,
    Eye,
    Edit3,
    Copy,
    Trash2,
    MoreHorizontal,
    Clock,
    Users,
    CheckCircle2,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type EditorMode = 'edit' | 'view' | 'comment';

type EnhancedEditorProps = {
    value: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    mode?: EditorMode;
    onSave?: () => void;
    isSaving?: boolean;
    lastSaved?: Date;
    collaborators?: Array<{ id: string; name: string; avatar?: string; color: string }>;
    wordCount?: boolean;
    readOnly?: boolean;
};

const lowlight = createLowlight(common);

export function EnhancedEditor({
    value,
    onChange,
    placeholder,
    className,
    mode = 'edit',
    onSave,
    isSaving = false,
    lastSaved,
    collaborators = [],
    wordCount = true,
    readOnly = false,
}: EnhancedEditorProps) {
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [tableDialogOpen, setTableDialogOpen] = useState(false);
    const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3 });

    const editor = useEditor({
        immediatelyRender: false,
        editable: mode === 'edit' && !readOnly,
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Highlight,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Underline,
            CodeBlockLowlight.configure({
                lowlight,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline',
                },
            }),
            TableKit.configure({}),
            TableRow,
            TableCell,
            Placeholder.configure({
                placeholder: placeholder || 'Type / to use commands...',
                emptyEditorClass:
                    'is-editor-empty before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none before:h-0',
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: cn(
                    'min-h-[600px] w-full rounded-md border-0 bg-transparent px-6 py-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:shadow-sm',
                    className,
                    mode === 'view' && 'prose-pointer-events-none'
                ),
            },
        },
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && editor.getHTML() !== value) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return <div className="flex items-center justify-center h-full text-muted-foreground">Loading editor...</div>;
    }

    const addLink = () => {
        if (linkUrl) {
            editor.chain().focus().setLink({ href: linkUrl }).run();
            setLinkDialogOpen(false);
            setLinkUrl('');
        }
    };

    const addTable = () => {
        editor
            .chain()
            .focus()
            .insertTable({ rows: tableConfig.rows, cols: tableConfig.cols, withHeaderRow: true })
            .run();
        setTableDialogOpen(false);
    };

    const exportAsHTML = () => {
        const html = editor.getHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.html';
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportAsText = () => {
        const text = editor.getText();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(editor.getText());
    };

    const wordCountValue = editor.getText().split(/\s+/).filter((w) => w.length > 0).length;
    const charCount = editor.getText().length;

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Enhanced Toolbar */}
            {mode === 'edit' && (
                <>
                    {/* Main Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b bg-muted/30 sticky top-0 z-20">
                        {/* History */}
                        <div className="flex items-center gap-1 pr-2 border-r">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().undo().run()}
                                disabled={!editor.can().undo()}
                                className="h-8 w-8"
                            >
                                <Undo className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().redo().run()}
                                disabled={!editor.can().redo()}
                                className="h-8 w-8"
                            >
                                <Redo className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Text Formatting */}
                        <div className="flex items-center gap-1 px-2 border-r">
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('bold')}
                                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                                className="h-8"
                            >
                                <Bold className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('italic')}
                                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                                className="h-8"
                            >
                                <Italic className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('underline')}
                                onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                                className="h-8"
                            >
                                <UnderlineIcon className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('strike')}
                                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                                className="h-8"
                            >
                                <Strikethrough className="h-4 w-4" />
                            </Toggle>
                        </div>

                        {/* Headings */}
                        <div className="flex items-center gap-1 px-2 border-r">
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('heading', { level: 1 })}
                                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                className="h-8"
                            >
                                <Heading1 className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('heading', { level: 2 })}
                                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                className="h-8"
                            >
                                <Heading2 className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('heading', { level: 3 })}
                                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                className="h-8"
                            >
                                <Heading3 className="h-4 w-4" />
                            </Toggle>
                        </div>

                        {/* Lists & Align */}
                        <div className="flex items-center gap-1 px-2 border-r">
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('bulletList')}
                                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                                className="h-8"
                            >
                                <List className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('orderedList')}
                                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                                className="h-8"
                            >
                                <ListOrdered className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive({ textAlign: 'left' })}
                                onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
                                className="h-8"
                            >
                                <AlignLeft className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive({ textAlign: 'center' })}
                                onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
                                className="h-8"
                            >
                                <AlignCenter className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive({ textAlign: 'right' })}
                                onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
                                className="h-8"
                            >
                                <AlignRight className="h-4 w-4" />
                            </Toggle>
                        </div>

                        {/* Advanced */}
                        <div className="flex items-center gap-1 px-2">
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('blockquote')}
                                onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                                className="h-8"
                            >
                                <Quote className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('codeBlock')}
                                onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
                                className="h-8"
                            >
                                <Code className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('highlight')}
                                onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
                                className="h-8"
                            >
                                <Highlighter className="h-4 w-4" />
                            </Toggle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setLinkDialogOpen(true)}
                                className={cn('h-8 w-8', editor.isActive('link') && 'bg-muted')}
                            >
                                <LinkIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTableDialogOpen(true)}
                                className="h-8 w-8"
                            >
                                <TableIcon className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-auto pl-2 border-l">
                            {onSave && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={onSave}
                                    disabled={isSaving}
                                    className="h-8 gap-2"
                                >
                                    {isSaving ? (
                                        <Clock className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    Save
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={copyToClipboard}>
                                        <Copy className="mr-2 h-4 w-4" /> Copy Text
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={exportAsHTML}>
                                        <Download className="mr-2 h-4 w-4" /> Export as HTML
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={exportAsText}>
                                        <FileText className="mr-2 h-4 w-4" /> Export as Text
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Bubble Menu */}
                    <BubbleMenu editor={editor} className="z-50">
                        <div className="flex items-center gap-1 p-1 bg-popover border rounded-md shadow-lg">
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('bold')}
                                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                                className="h-7"
                            >
                                <Bold className="h-3.5 w-3.5" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('italic')}
                                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                                className="h-7"
                            >
                                <Italic className="h-3.5 w-3.5" />
                            </Toggle>
                            <Toggle
                                size="sm"
                                pressed={editor.isActive('strike')}
                                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                                className="h-7"
                            >
                                <Strikethrough className="h-3.5 w-3.5" />
                            </Toggle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    const url = prompt('Enter link URL:');
                                    if (url) editor.chain().focus().setLink({ href: url }).run();
                                }}
                                className={cn('h-7 w-7', editor.isActive('link') && 'bg-muted')}
                            >
                                <LinkIcon className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </BubbleMenu>

                    {/* Floating Menu */}
                    <FloatingMenu editor={editor} className="z-50">
                        <div className="flex items-center gap-1 p-1 bg-popover border rounded-md shadow-lg">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                className={cn('h-7 w-7', editor.isActive('heading', { level: 1 }) && 'bg-muted')}
                            >
                                <Heading1 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                className={cn('h-7 w-7', editor.isActive('heading', { level: 2 }) && 'bg-muted')}
                            >
                                <Heading2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                className={cn('h-7 w-7', editor.isActive('bulletList') && 'bg-muted')}
                            >
                                <List className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                className={cn('h-7 w-7', editor.isActive('orderedList') && 'bg-muted')}
                            >
                                <ListOrdered className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                className={cn('h-7 w-7', editor.isActive('blockquote') && 'bg-muted')}
                            >
                                <Quote className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                className={cn('h-7 w-7', editor.isActive('codeBlock') && 'bg-muted')}
                            >
                                <Code className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </FloatingMenu>
                </>
            )}

            {/* View Mode Header */}
            {mode === 'view' && (
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 sticky top-0 z-20">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>Read-only mode</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {collaborators.length > 0 && (
                            <div className="flex -space-x-2">
                                {collaborators.slice(0, 5).map((c) => (
                                    <div
                                        key={c.id}
                                        className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white"
                                        style={{ backgroundColor: c.color }}
                                        title={c.name}
                                    >
                                        {c.name.charAt(0)}
                                    </div>
                                ))}
                                {collaborators.length > 5 && (
                                    <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                                        +{collaborators.length - 5}
                                    </div>
                                )}
                            </div>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={copyToClipboard}>
                                    <Copy className="mr-2 h-4 w-4" /> Copy Text
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={exportAsHTML}>
                                    <Download className="mr-2 h-4 w-4" /> Export as HTML
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={exportAsText}>
                                    <FileText className="mr-2 h-4 w-4" /> Export as Text
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            )}

            {/* Editor Content */}
            <div className="flex-1 overflow-auto">
                <EditorContent editor={editor} className="h-full" />
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    {wordCount && (
                        <>
                            <span>{wordCountValue} words</span>
                            <span>{charCount} characters</span>
                        </>
                    )}
                    {lastSaved && (
                        <span className="flex items-center gap-1">
                            {isSaving ? (
                                <>
                                    <Clock className="h-3 w-3 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    Saved {lastSaved.toLocaleTimeString()}
                                </>
                            )}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {collaborators.length > 0 && (
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{collaborators.length} online</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Link Dialog */}
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Link</DialogTitle>
                        <DialogDescription>Enter the URL you want to link to.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                                id="url"
                                placeholder="https://example.com"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={addLink} disabled={!linkUrl}>
                            Add Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table Dialog */}
            <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Insert Table</DialogTitle>
                        <DialogDescription>Configure your table dimensions.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="rows">Rows</Label>
                            <Input
                                id="rows"
                                type="number"
                                min="1"
                                max="20"
                                value={tableConfig.rows}
                                onChange={(e) => setTableConfig({ ...tableConfig, rows: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cols">Columns</Label>
                            <Input
                                id="cols"
                                type="number"
                                min="1"
                                max="10"
                                value={tableConfig.cols}
                                onChange={(e) => setTableConfig({ ...tableConfig, cols: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTableDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={addTable}>Insert Table</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
